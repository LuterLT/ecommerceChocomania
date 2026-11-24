import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Carrinho } from '../../core/models';
import { CartService } from './cart.service';

const emptyCart = (versao: number): Carrinho => ({
  id: 'cart-1', versao, moeda: 'BRL', itens: [],
  subtotalCentavos: 0, descontoCentavos: 0, totalCentavos: 0,
});

const filledCart = (versao: number): Carrinho => ({
  ...emptyCart(versao), subtotalCentavos: 2000, totalCentavos: 2000,
  itens: [{ produtoId: 1, titulo: 'Chocolate', imagemUrl: '/chocolate.webp', quantidade: 2,
    estoqueDisponivel: 10, precoBaseCentavos: 1000, precoFinalCentavos: 1000,
    totalCentavos: 2000, situacao: 'DISPONIVEL' }],
});

describe('CartService HTTP contracts', () => {
  let service: CartService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CartService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try { http.verify(); }
    finally { TestBed.resetTestingModule(); }
  });

  function csrf(): void {
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf-token', headerName: 'X-CSRF-TOKEN' });
  }

  async function load(version = 2): Promise<void> {
    const loading = service.load();
    http.expectOne('/api/v1/carrinho').flush(emptyCart(version), { headers: { ETag: `"${version}"` } });
    await loading;
  }

  it('adds once per intent with CSRF, credentials and distinct idempotency keys', async () => {
    const first = service.add(1, 2);
    csrf();
    const request = http.expectOne('/api/v1/carrinho/itens');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ produtoId: 1, quantidade: 2 });
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-token');
    const firstKey = request.request.headers.get('Idempotency-Key');
    expect(firstKey).toBeTruthy();
    request.flush(emptyCart(2), { headers: { ETag: '"2"' } });
    await first;

    const second = service.add(1, 1);
    csrf();
    const secondRequest = http.expectOne('/api/v1/carrinho/itens');
    expect(secondRequest.request.headers.get('Idempotency-Key')).not.toBe(firstKey);
    secondRequest.flush(emptyCart(3));
    await second;
  });

  it('uses the confirmed ETag, reloads a conflict and never replays the mutation', async () => {
    await load();
    const updating = service.update(1, 3);
    csrf();
    const patch = http.expectOne('/api/v1/carrinho/itens/1');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.headers.get('If-Match')).toBe('"2"');
    patch.flush({ codigo: 'VERSAO_DIVERGENTE', mensagem: 'Conflito' }, { status: 412, statusText: 'Precondition Failed' });
    await vi.waitFor(() => {
      http.expectOne('/api/v1/carrinho').flush(emptyCart(3), { headers: { ETag: '"3"' } });
    });
    await updating;
    expect(service.cart()?.versao).toBe(3);
    expect(service.error()).toContain('outra janela');
    http.expectNone('/api/v1/carrinho/itens/1');
  });

  it('serializes actions and ignores a response from a previous session', async () => {
    const adding = service.add(1, 1);
    await service.add(2, 1);
    csrf();
    const request = http.expectOne('/api/v1/carrinho/itens');
    expect(request.request.body.produtoId).toBe(1);
    service.reset();
    const refreshing = http.expectOne('/api/v1/carrinho');
    request.flush(emptyCart(2));
    await adding;
    expect(service.cart()).toBeNull();
    expect(service.busy()).toBe(true);
    refreshing.flush(emptyCart(3));
    await vi.waitFor(() => expect(service.busy()).toBe(false));
    expect(service.cart()?.versao).toBe(3);
  });

  it('refreshes an in-flight read after a session change without accepting the old cart', async () => {
    const oldLoad = service.load();
    const oldRequest = http.expectOne('/api/v1/carrinho');
    service.reset();
    const newRequest = http.expectOne('/api/v1/carrinho');
    newRequest.flush({ ...emptyCart(1), id: 'new-session-cart' });
    await vi.waitFor(() => expect(service.cart()?.id).toBe('new-session-cart'));
    oldRequest.flush({ ...emptyCart(8), id: 'old-session-cart' });
    await oldLoad;
    expect(service.cart()?.id).toBe('new-session-cart');
    expect(service.busy()).toBe(false);
  });

  it('retains the confirmed cart when a stock update is rejected', async () => {
    await load();
    const updating = service.update(1, 1000);
    csrf();
    http.expectOne('/api/v1/carrinho/itens/1').flush(
      { codigo: 'ESTOQUE_INSUFICIENTE', mensagem: 'Estoque insuficiente.' },
      { status: 409, statusText: 'Conflict' },
    );
    await updating;
    expect(service.cart()?.versao).toBe(2);
    expect(service.error()).toBe('Estoque insuficiente.');
  });

  async function loadFilled(): Promise<void> {
    const loading = service.load();
    http.expectOne('/api/v1/carrinho').flush(filledCart(2), { headers: { ETag: '"2"' } });
    await loading;
  }

  it('places one order with CSRF and ETag, then accepts the empty cart and confirmation', async () => {
    await loadFilled();
    const ordering = service.order();
    await service.order();
    csrf();
    const request = http.expectOne('/api/v1/pedidos');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('If-Match')).toBe('"2"');
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-token');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ id: 42, totalCentavos: 2000, carrinho: emptyCart(3) }, { headers: { ETag: '"3"' } });
    await ordering;
    expect(service.cart()).toEqual(emptyCart(3));
    expect(service.success()).toContain('#42');
    expect(service.canOrder()).toBe(false);
    expect(service.busy()).toBe(false);
  });

  it('preserves the cart when the order fails', async () => {
    await loadFilled();
    const ordering = service.order();
    csrf();
    http.expectOne('/api/v1/pedidos').flush(
      { mensagem: 'Não foi possível salvar o pedido.' }, { status: 500, statusText: 'Server Error' },
    );
    await ordering;
    expect(service.cart()).toEqual(filledCart(2));
    expect(service.success()).toBe('');
    expect(service.error()).toBe('Não foi possível salvar o pedido.');
  });

  it('blocks empty carts and unavailable items', async () => {
    await load();
    await service.order();
    expect(service.error()).toContain('produtos disponíveis');
    const loading = service.load();
    const cart = filledCart(3);
    cart.itens[0].situacao = 'ESTOQUE_INSUFICIENTE';
    http.expectOne('/api/v1/carrinho').flush(cart);
    await loading;
    expect(service.canOrder()).toBe(false);
    await service.order();
    http.expectNone('/api/v1/pedidos');
  });

  it('ignores an order response after changing the session', async () => {
    await loadFilled();
    const ordering = service.order();
    csrf();
    const request = http.expectOne('/api/v1/pedidos');
    service.reset();
    const refreshing = http.expectOne('/api/v1/carrinho');
    request.flush({ id: 42, totalCentavos: 2000, carrinho: emptyCart(3) });
    await ordering;
    expect(service.success()).toBe('');
    expect(service.cart()).toBeNull();
    refreshing.flush(emptyCart(1));
    await vi.waitFor(() => expect(service.busy()).toBe(false));
    expect(service.cart()?.versao).toBe(1);
  });
});

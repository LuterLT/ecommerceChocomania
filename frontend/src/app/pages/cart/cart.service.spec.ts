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
});

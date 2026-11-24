import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { Carrinho, Usuario } from '../../core/models';
import { CartService } from './cart.service';
import { CarrinhoComponent } from './carrinho.component';

describe('CarrinhoComponent order authentication', () => {
  let fixture: ComponentFixture<CarrinhoComponent>;
  let router: Router;
  const user = signal<Usuario | null>(null);
  const busy = signal(false);
  const store = {
    busy, error: signal(''), success: signal(''), canOrder: signal(true),
    cart: signal<Carrinho>({
      id: 'cart-1', versao: 2, moeda: 'BRL', subtotalCentavos: 1000, descontoCentavos: 0,
      totalCentavos: 1000,
      itens: [{ produtoId: 1, titulo: 'Chocolate', imagemUrl: 'chocolate.webp', quantidade: 1,
        estoqueDisponivel: 10, precoBaseCentavos: 1000, precoFinalCentavos: 1000,
        totalCentavos: 1000, situacao: 'DISPONIVEL' }],
    }),
    load: vi.fn().mockResolvedValue(undefined), order: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    user.set(null);
    busy.set(false);
    await TestBed.configureTestingModule({
      imports: [CarrinhoComponent],
      providers: [provideRouter([]), { provide: CartService, useValue: store },
        { provide: AuthService, useValue: { usuario: user } }],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(CarrinhoComponent);
    fixture.detectChanges();
  });

  it('keeps the visitor cart accessible and sends visitors to login before ordering', () => {
    expect(store.load).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Chocolate');
    expect(fixture.nativeElement.textContent).toContain('Entre na sua conta para realizar o pedido.');
    fixture.nativeElement.querySelector('.botao-prosseguir').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(store.order).not.toHaveBeenCalled();
  });

  it('allows logged-in customers to place the order', () => {
    user.set({ id: 1, nomeCompleto: 'Ana', email: 'ana@example.com' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.botao-prosseguir').click();
    expect(store.order).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('blocks order actions while the cart is busy', () => {
    user.set({ id: 1, nomeCompleto: 'Ana', email: 'ana@example.com' });
    busy.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.botao-prosseguir').disabled).toBe(true);
    fixture.componentInstance.order();
    expect(store.order).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

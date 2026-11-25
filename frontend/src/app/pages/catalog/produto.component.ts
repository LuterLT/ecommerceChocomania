import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api.service';
import { ProdutoDetalhe } from '../../core/models';
import { fallbackImage, resolveMediaUrl } from '../../shared/media';
import { CartService } from '../cart/cart.service';

@Component({
  selector: 'app-produto',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    @if (loading()) { <p class="produto-nao-encontrado" role="status">Carregando produto…</p> }
    @if (error()) { <div class="produto-nao-encontrado" role="alert"><p>{{ error() }}</p><button type="button" (click)="retry.next()">Tentar novamente</button></div> }
    @if (product(); as item) {
      <article class="produto-detalhe">
        <div class="produto-imagem-container"><img class="produto-imagem" [src]="media(item.imagemUrl)" [alt]="item.titulo" (error)="fallback($event)"></div>
        <div class="produto-informacoes">
          <p class="produto-categoria">{{ item.categoria.nome }}</p>
          <h1>{{ item.titulo }}</h1>
          <p class="produto-descricao">{{ item.descricao }}</p>
          <div class="produto-preco">
            @if (item.descontoPercentual > 0) { <span class="preco-original"><span class="sr-only">Preço original: </span>{{ item.precoBaseCentavos / 100 | currency:'BRL' }}</span> }
            <strong [class.preco-desconto]="item.descontoPercentual > 0">{{ item.precoFinalCentavos / 100 | currency:'BRL' }}</strong>
          </div>
          <p class="produto-estoque">{{ item.estoqueDisponivel > 0 ? item.estoqueDisponivel + ' unidades disponíveis' : 'Produto indisponível' }}</p>
          <div class="produto-acoes">
            <div class="controle-quantidade" role="group" aria-label="Quantidade do produto">
              <button type="button" aria-label="Diminuir quantidade" [disabled]="quantity() <= 1 || cart.busy() || item.estoqueDisponivel === 0" (click)="changeQuantity(-1)">−</button>
              <span aria-live="polite">{{ quantity() }}</span>
              <button type="button" aria-label="Aumentar quantidade" [disabled]="quantity() >= item.estoqueDisponivel || cart.busy()" (click)="changeQuantity(1)">+</button>
            </div>
            <button class="botao-carrinho" type="button" [disabled]="cart.busy() || item.estoqueDisponivel === 0" (click)="add()">{{ cart.busy() ? 'Adicionando…' : 'Adicionar ao carrinho' }}</button>
          </div>
          @if (message()) { <p role="status">{{ message() }} <a routerLink="/carrinho">Ver carrinho</a></p> }
          @if (addError()) { <p role="alert">{{ addError() }}</p> }
        </div>
      </article>
    }
  `,
  styleUrl: './produto.component.css',
})
export class ProdutoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  readonly cart = inject(CartService);
  readonly retry = new Subject<void>();
  readonly product = signal<ProdutoDetalhe | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly quantity = signal(1);
  readonly message = signal('');
  readonly addError = signal('');
  readonly media = resolveMediaUrl;
  readonly fallback = fallbackImage;

  constructor() {
    combineLatest([this.route.paramMap, this.retry.pipe(startWith(undefined))]).pipe(
      switchMap(([params]) => {
        this.product.set(null);
        this.loading.set(true);
        this.error.set('');
        this.message.set('');
        this.addError.set('');
        this.quantity.set(1);
        const id = Number(params.get('id'));
        if (!Number.isSafeInteger(id) || id <= 0) return of({ product: null, error: 'Produto não encontrado.' });
        return this.api.get<ProdutoDetalhe>(`/produtos/${id}`).pipe(
          map(product => ({ product, error: '' })),
          catchError(error => of({ product: null, error: error?.status === 404 ? 'Produto não encontrado.' : apiErrorMessage(error) })),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(state => {
      this.product.set(state.product);
      this.error.set(state.error);
      this.loading.set(false);
    });
  }

  changeQuantity(delta: number): void {
    this.quantity.update(value => Math.max(1, Math.min(this.product()?.estoqueDisponivel ?? 1, value + delta)));
  }

  async add(): Promise<void> {
    const product = this.product();
    if (!product || product.estoqueDisponivel < 1 || this.cart.busy()) return;
    this.message.set('');
    this.addError.set('');
    await this.cart.add(product.id, this.quantity());
    if (this.product()?.id !== product.id) return;
    if (this.cart.error()) this.addError.set(this.cart.error());
    else this.message.set('Produto adicionado ao carrinho.');
  }
}

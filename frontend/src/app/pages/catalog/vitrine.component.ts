import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api.service';
import { Categoria, ProdutoResumo } from '../../core/models';
import { CatalogService } from '../../shared/catalog.service';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'app-vitrine',
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <h1 class="sr-only">Catálogo de chocolates Chocomania</h1>
    @if (loading()) { <p class="state" role="status">Carregando chocolates…</p> }
    @if (error()) { <div class="state" role="alert"><p>{{ error() }}</p><button type="button" (click)="load()">Tentar novamente</button></div> }
    @if (!loading() && !error()) {
      @for (group of groups(); track group.category.id) {
        <section class="carousel" [attr.aria-labelledby]="'category-' + group.category.id">
          <h2 [id]="'category-' + group.category.id">Categoria: {{ group.category.nome }}</h2>
          @if (group.products.length) {
            <div class="controls">
              <button type="button" [attr.aria-label]="'Produtos anteriores de ' + group.category.nome" (click)="move(track, -1)">‹</button>
              <span>Deslize ou use as setas para explorar</span>
              <button type="button" [attr.aria-label]="'Próximos produtos de ' + group.category.nome" (click)="move(track, 1)">›</button>
            </div>
            <div #track class="track" tabindex="0" role="region" [attr.aria-label]="group.category.nome">
              @for (product of group.products; track product.id) { <app-product-card [product]="product" /> }
            </div>
          } @else { <p class="state">Nenhum produto nesta categoria.</p> }
        </section>
      } @empty { <p class="state">Nenhum produto disponível.</p> }
    }
  `,
  styles: `
    :host { display:block; padding:1rem 0 2rem; color:#fff0bd; }
    .carousel { position:relative; max-width:1440px; margin:0 auto 1.25rem; min-width:0; }
    h2 { padding:.75rem 1rem .25rem; margin:0; font:700 1.25rem Georgia,serif; }
    .track { position:relative; display:flex; overflow-x:auto; gap:1rem; padding:1rem; scroll-snap-type:x proximity; scroll-padding-inline:1rem; scrollbar-width:none; }
    .track::-webkit-scrollbar { display:none; }
    app-product-card { flex:0 0 300px; scroll-snap-align:start; }
    .controls { display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:0 1rem; font-size:.85rem; }
    .controls button { flex-shrink:0; border:0; border-radius:50%; width:44px; height:44px; background:#3b170f; color:#fff0bd; font-size:2rem; cursor:pointer; }
    .controls span { text-align:center; }
    .state { text-align:center; padding:2rem 1rem; }
    @media(max-width:600px) { h2 { font-size:1.1rem; } app-product-card { flex-basis:175px; } .track { gap:.6rem; } }
  `,
})
export class VitrineComponent {
  private readonly api = inject(ApiService);
  private readonly catalog = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly groups = signal<{ category: Categoria; products: ProdutoResumo[] }[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    forkJoin({ categories: this.api.get<{ itens: Categoria[] }>('/categorias'), products: this.catalog.list() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ categories, products }) => {
          this.groups.set([...categories.itens].sort((a, b) => a.ordem - b.ordem || a.id - b.id)
            .map(category => ({ category, products: products.filter(product => product.categoriaId === category.id) })));
          this.loading.set(false);
        },
        error: error => { this.error.set(apiErrorMessage(error)); this.loading.set(false); },
      });
  }

  move(track: HTMLElement, direction: number): void {
    const cardWidth = track.firstElementChild?.getBoundingClientRect().width ?? 300;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (cardWidth + gap), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

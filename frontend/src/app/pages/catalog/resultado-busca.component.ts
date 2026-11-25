import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api.service';
import { ProdutoResumo } from '../../core/models';
import { CatalogService } from '../../shared/catalog.service';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'app-resultado-busca',
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <section class="results" aria-labelledby="results-title">
      <h1 id="results-title">Resultados para: {{ query() || 'Todos os produtos' }}</h1>
      @if (loading()) { <p role="status">Buscando chocolates…</p> }
      @if (error()) { <div role="alert"><p>{{ error() }}</p><button type="button" (click)="retry.next()">Tentar novamente</button></div> }
      @if (!loading() && !error()) {
        <p role="status">{{ products().length }} produto(s) encontrado(s).</p>
        <div class="results-grid">
          @for (product of products(); track product.id) { <app-product-card [product]="product" /> }
          @empty { <p>Nenhum produto encontrado.</p> }
        </div>
      }
    </section>
  `,
  styles: `
    .results { max-width:1200px; margin:auto; padding:2rem 1rem 3rem; color:#fff0bd; font-family:'Trebuchet MS',sans-serif; }
    h1 { margin:0 0 1.5rem; font:700 clamp(1.7rem,4vw,2.5rem) Georgia,serif; overflow-wrap:anywhere; }
    .results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr)); gap:1rem; }
    @media(min-width:375px) and (max-width:600px) { .results-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:.6rem; } .results { padding:1.25rem .75rem 2rem; } }
  `,
})
export class ResultadoBuscaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  readonly retry = new Subject<void>();
  readonly query = signal('');
  readonly products = signal<ProdutoResumo[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    combineLatest([this.route.queryParamMap, this.retry.pipe(startWith(undefined))]).pipe(
      switchMap(([params]) => {
        const query = (params.get('busca') ?? '').trim();
        this.query.set(query);
        this.loading.set(true);
        this.error.set('');
        return this.catalog.list(query).pipe(
          map(products => ({ products, error: '' })),
          catchError(error => of({ products: [] as ProdutoResumo[], error: apiErrorMessage(error) })),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(state => {
      this.products.set(state.products);
      this.error.set(state.error);
      this.loading.set(false);
    });
  }
}

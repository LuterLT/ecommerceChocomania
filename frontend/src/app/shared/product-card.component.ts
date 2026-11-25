import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProdutoResumo } from '../core/models';
import { fallbackImage, resolveMediaUrl } from './media';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    <a class="product-card" [routerLink]="['/produto', product().id]">
      <img [src]="media(product().imagemUrl)" [alt]="product().titulo" loading="lazy" width="220" height="180" (error)="fallback($event)">
      <h2>{{ product().titulo }}</h2>
      <div class="prices">
        @if (product().descontoPercentual > 0) {
          <span class="original"><span class="sr-only">Preço original: </span>{{ product().precoBaseCentavos / 100 | currency:'BRL' }}</span>
        }
        <strong [class.discount]="product().descontoPercentual > 0">{{ product().precoFinalCentavos / 100 | currency:'BRL' }}</strong>
      </div>
      @if (product().estoqueDisponivel === 0) { <span>Indisponível</span> }
    </a>
  `,
  styles: `
    :host { display:block; min-width:0; height:100%; }
    .product-card { box-sizing:border-box; display:flex; height:100%; min-height:340px; flex-direction:column; align-items:center; justify-content:space-between; gap:1rem; padding:1.25rem 1rem 2rem; border-radius:.5rem; background:#f4c96d; color:#3b170f; text-decoration:none; transition:transform 180ms; font-family:'Arial Rounded MT Bold','Trebuchet MS',sans-serif; }
    .product-card:hover { transform:translateY(-4px); }
    img { width: min(220px,100%); height:180px; object-fit:cover; border-radius:.25rem; }
    h2 { margin:0; width:100%; font-size:1.4rem; line-height:1.25; text-align:center; overflow-wrap:anywhere; }
    .prices { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:.5rem; }
    .original { color:#624c38; text-decoration:line-through; }
    strong { font-size:1.5rem; } .discount { color:#a41d13; }
    @media(max-width:600px) { .product-card { min-height:275px; padding:.8rem .6rem 1rem; } img { height:130px; } h2 { font-size:1.1rem; } strong { font-size:1.2rem; } }
    @media(prefers-reduced-motion:reduce) { .product-card { transition:none; } }
  `,
})
export class ProductCardComponent {
  readonly product = input.required<ProdutoResumo>();
  readonly media = resolveMediaUrl;
  readonly fallback = fallbackImage;
}

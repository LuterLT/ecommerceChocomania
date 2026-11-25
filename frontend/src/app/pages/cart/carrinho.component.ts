import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from './cart.service';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrinho.component.html',
  styleUrl: './carrinho.component.css',
})
export class CarrinhoComponent implements OnInit {
  readonly store = inject(CartService);

  ngOnInit(): void {
    void this.store.load();
  }

  image(path: string): string {
    return new URL(path.startsWith('/') ? path.slice(1) : path, document.baseURI).href;
  }

  fallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.dataset['fallback']) return;
    image.dataset['fallback'] = 'true';
    image.src = this.image('ProdutoSemImagem.webp');
  }
}

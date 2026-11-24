import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
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
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.store.load();
  }

  order(): void {
    if (this.store.busy()) return;
    if (!this.auth.usuario()) {
      void this.router.navigateByUrl('/login');
      return;
    }
    void this.store.order();
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

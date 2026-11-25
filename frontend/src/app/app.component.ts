import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { AuthService } from './core/auth.service';
import { CartService } from './pages/cart/cart.service';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly busca = new FormControl('', { nonNullable: true });
  readonly sessionError = signal(false);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);

  constructor() {
    effect(() => {
      this.auth.usuario();
      this.cart.reset();
    });
    this.auth.restore().pipe(takeUntilDestroyed()).subscribe({ error: () => this.sessionError.set(true) });
    this.busca.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(value => this.pesquisar(value, true));
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        const tree = this.router.parseUrl(this.router.url);
        this.busca.setValue(tree.queryParams['busca'] ?? '', { emitEvent: false });
        if (document.activeElement?.id !== 'product-search') {
          document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
        }
      });
  }

  pesquisar(value = this.busca.value, replaceUrl = false): void {
    const busca = value.trim();
    void this.router.navigate([busca ? '/resultado-busca' : '/'], { queryParams: busca ? { busca } : {}, replaceUrl });
  }
}

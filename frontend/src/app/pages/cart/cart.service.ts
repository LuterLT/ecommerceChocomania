import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api.service';
import { Carrinho, Pedido } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private etag: string | null = null;
  private generation = 0;
  readonly cart = signal<Carrinho | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly canOrder = computed(() => {
    const items = this.cart()?.itens;
    return !!items?.length && items.every(item => item.situacao === 'DISPONIVEL');
  });

  reset(): void {
    const refresh = untracked(() => this.busy() || this.cart() !== null);
    this.generation++;
    this.cart.set(null);
    this.etag = null;
    this.error.set('');
    this.success.set('');
    this.busy.set(false);
    // A session change must not leave an open cart page waiting on an ignored request.
    if (refresh) untracked(() => { void this.load(); });
  }

  async load(): Promise<void> {
    await this.perform(() => this.fetchCart());
  }

  async add(produtoId: number, quantidade: number): Promise<void> {
    await this.perform(async () => {
      const response = await firstValueFrom(this.api.request<Carrinho>(
        'POST', '/carrinho/itens', { produtoId, quantidade },
        { 'Idempotency-Key': crypto.randomUUID() },
      ));
      return response;
    });
  }

  async update(produtoId: number, quantidade: number): Promise<void> {
    await this.mutate('PATCH', produtoId, { quantidade });
  }

  async remove(produtoId: number): Promise<void> {
    await this.mutate('DELETE', produtoId);
  }

  async order(): Promise<void> {
    if (this.busy()) return;
    if (!this.canOrder()) {
      this.error.set('Adicione produtos disponíveis e confira as quantidades antes de realizar o pedido.');
      return;
    }
    const generation = this.generation;
    await this.perform(async () => {
      if (!this.etag) {
        const response = await this.fetchCart();
        if (generation !== this.generation) return response;
        this.confirm(response);
      }
      const response = await firstValueFrom(this.api.request<Pedido>(
        'POST', '/pedidos', undefined, { 'If-Match': this.etag! },
      ));
      if (!response.body?.carrinho) throw new Error('A API não retornou o carrinho do pedido.');
      if (generation === this.generation) {
        this.success.set(`Pedido #${response.body.id} realizado com sucesso!`);
      }
      return response.clone<Carrinho>({ body: response.body.carrinho });
    });
  }

  private async mutate(method: string, produtoId: number, body?: { quantidade: number }): Promise<void> {
    const generation = this.generation;
    await this.perform(async () => {
      // A fresh read is necessary when the service has no confirmed version yet.
      if (!this.etag) {
        const response = await this.fetchCart();
        if (generation !== this.generation) return response;
        this.confirm(response);
      }
      return firstValueFrom(this.api.request<Carrinho>(method, `/carrinho/itens/${produtoId}`, body,
        { 'If-Match': this.etag! }));
    });
  }

  private fetchCart(): Promise<HttpResponse<Carrinho>> {
    return firstValueFrom(this.api.request<Carrinho>('GET', '/carrinho'));
  }

  private confirm(response: HttpResponse<Carrinho>): void {
    if (!response.body) throw new Error('A API retornou um carrinho vazio.');
    this.cart.set(response.body);
    this.etag = response.headers.get('ETag') ?? `"${response.body.versao}"`;
  }

  private async perform(action: () => Promise<HttpResponse<Carrinho>>): Promise<void> {
    // Serialize user actions so that two changes never share an obsolete ETag.
    if (this.busy()) return;
    const generation = this.generation;
    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const response = await action();
      if (generation === this.generation) this.confirm(response);
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      if (error instanceof HttpErrorResponse && (error.status === 412 || error.status === 428)) {
        try {
          const current = await this.fetchCart();
          if (generation !== this.generation) return;
          this.confirm(current);
          this.error.set('O carrinho foi alterado em outra janela. Confira as quantidades antes de tentar novamente.');
        } catch (refreshError: unknown) {
          if (generation === this.generation) this.error.set(apiErrorMessage(refreshError));
        }
      } else {
        this.error.set(apiErrorMessage(error));
      }
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }
}

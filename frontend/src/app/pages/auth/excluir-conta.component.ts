import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-excluir-conta',
  standalone: true,
  styleUrl: './auth.css',
  template: `
    <section class="login-page">
      <div class="login-card">
        <div class="login-heading">
          <h1>Excluir minha conta?</h1>
          <p>Sua conta e seu carrinho serão excluídos permanentemente. Esta ação não pode ser desfeita.</p>
        </div>
        <div class="login-form" [attr.aria-busy]="deleting()">
          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          <button type="button" class="delete-account-confirm" [disabled]="deleting()" (click)="confirm()">
            {{ deleting() ? 'EXCLUINDO…' : 'SIM, EXCLUIR MINHA CONTA' }}
          </button>
        </div>
        <p class="auth-link">
          <button type="button" class="logout-link" [disabled]="deleting()" (click)="cancel()">Cancelar e manter minha conta</button>
        </p>
      </div>
    </section>
  `,
})
export class ExcluirContaComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly deleting = signal(false);
  readonly error = signal('');

  confirm(): void {
    if (this.deleting()) return;
    this.error.set('');
    this.deleting.set(true);
    // Let the request finish after navigation so AuthService can clear a deleted account.
    this.auth.deleteAccount().pipe(finalize(() => this.deleting.set(false))).subscribe({
      next: () => {
        if (!this.destroyRef.destroyed) void this.router.navigateByUrl('/login', { replaceUrl: true });
      },
      error: (error: unknown) => {
        if (!this.destroyRef.destroyed) this.error.set(apiErrorMessage(error));
      },
    });
  }

  cancel(): void {
    if (this.deleting()) return;
    void this.router.navigateByUrl('/logado');
  }
}

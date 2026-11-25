import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ErroApi } from '../../core/models';

@Component({
  selector: 'app-logado',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './auth.css',
  template: `
    <section class="login-page">
      <div class="login-card">
        <div class="login-heading logged-in-message">
          <h1>Bem-vindo, {{ auth.usuario()?.nomeCompleto }}</h1>
          <p>Minha conta: atualize seu nome e e-mail.</p>
        </div>
        <form class="login-form" [formGroup]="form" (ngSubmit)="save()" novalidate [attr.aria-busy]="saving()">
          <div class="form-field">
            <label for="perfil-nome">Nome completo</label>
            <input id="perfil-nome" type="text" formControlName="nomeCompleto" autocomplete="name" maxlength="120"
              [readOnly]="busy() || saving()" [class.input-error]="invalid('nomeCompleto')"
              [attr.aria-invalid]="invalid('nomeCompleto')" aria-describedby="perfil-nome-error" />
            @if (invalid('nomeCompleto')) { <small id="perfil-nome-error" class="field-error">Informe seu nome, até 120 caracteres.</small> }
          </div>
          <div class="form-field">
            <label for="perfil-email">E-mail</label>
            <input id="perfil-email" type="email" formControlName="email" autocomplete="email" maxlength="254"
              [readOnly]="busy() || saving()" [class.input-error]="invalid('email')"
              [attr.aria-invalid]="invalid('email')" aria-describedby="perfil-email-error" />
            @if (invalid('email')) { <small id="perfil-email-error" class="field-error">Informe um e-mail válido e ainda não cadastrado.</small> }
          </div>
          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          @if (success()) { <p class="form-success" role="status">{{ success() }}</p> }
          <button type="submit" [disabled]="busy() || saving()">{{ saving() ? 'SALVANDO…' : 'SALVAR ALTERAÇÕES' }}</button>
        </form>
        <p class="auth-link">
          <button type="button" class="logout-link" [disabled]="busy() || saving()" (click)="logout()">
            {{ busy() ? 'Saindo…' : 'Sair da conta' }}
          </button>
        </p>
        <p class="auth-link">
          <a [routerLink]="busy() || saving() ? null : '/logado/excluir'" [attr.aria-disabled]="busy() || saving()">Excluir minha conta</a>
        </p>
      </div>
    </section>
  `,
})
export class LogadoComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    nomeCompleto: [this.auth.usuario()?.nomeCompleto ?? '', [Validators.required, Validators.maxLength(120)]],
    email: [this.auth.usuario()?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(254)]],
  });

  invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  save(): void {
    if (this.busy() || this.saving()) return;
    this.error.set('');
    this.success.set('');
    this.form.controls.nomeCompleto.setValue(this.form.controls.nomeCompleto.value.trim());
    this.form.controls.email.setValue(this.form.controls.email.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.auth.updateProfile(this.form.getRawValue()).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)),
    ).subscribe({
      next: user => {
        this.form.reset({ nomeCompleto: user.nomeCompleto, email: user.email });
        this.success.set('Dados atualizados com sucesso.');
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error));
        if (error instanceof HttpErrorResponse) {
          const payload = error.error as Partial<ErroApi> | null;
          for (const field of Object.keys(this.form.controls) as (keyof typeof this.form.controls)[]) {
            if (payload?.campos?.[field] || (field === 'email' && payload?.codigo === 'EMAIL_JA_CADASTRADO')) {
              this.form.controls[field].setErrors({ server: true });
            }
          }
        }
      },
    });
  }

  logout(): void {
    if (this.busy() || this.saving()) return;
    this.error.set('');
    this.success.set('');
    this.busy.set(true);
    this.auth.logout().pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => { void this.router.navigateByUrl('/login'); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }
}

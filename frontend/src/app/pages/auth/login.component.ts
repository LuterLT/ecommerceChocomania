import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './auth.css',
  template: `
    <section class="login-page">
      <div class="login-card">
        <div class="login-heading">
          <h1>Entrar na Chocomania</h1>
          <p>Acesse sua conta e continue sua experiência mais doce.</p>
        </div>
        <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" novalidate [attr.aria-busy]="busy()">
          <div class="form-field">
            <label for="email">E-mail</label>
            <input id="email" type="email" formControlName="email" autocomplete="username" maxlength="254"
              placeholder="seuemail@exemplo.com" [class.input-error]="invalid('email')"
              [attr.aria-invalid]="invalid('email')" aria-describedby="email-error" />
            @if (invalid('email')) { <small id="email-error" class="field-error">Informe um e-mail válido.</small> }
          </div>
          <div class="form-field">
            <label for="password">Senha</label>
            <input id="password" type="password" formControlName="senha" autocomplete="current-password"
              placeholder="Digite sua senha" [class.input-error]="invalid('senha')"
              [attr.aria-invalid]="invalid('senha')" aria-describedby="password-error" />
            @if (invalid('senha')) { <small id="password-error" class="field-error">Informe sua senha.</small> }
          </div>
          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          <button type="submit" [disabled]="busy()">{{ busy() ? 'ENTRANDO…' : 'LOGAR' }}</button>
        </form>
        <p class="auth-link">Ainda não tem conta? <a routerLink="/cadastro">Cadastre-se</a></p>
      </div>
    </section>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    senha: ['', [Validators.required]],
  });

  invalid(field: 'email' | 'senha'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  submit(): void {
    if (this.busy()) return;
    this.error.set('');
    this.form.controls.email.setValue(this.form.controls.email.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    const { email, senha } = this.form.getRawValue();
    this.auth.login(email, senha).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => { this.form.controls.senha.reset(); void this.router.navigateByUrl('/'); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }
}

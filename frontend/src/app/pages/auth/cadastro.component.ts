import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ErroApi } from '../../core/models';

function nonBlank(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}

function passwordBytes(control: AbstractControl): ValidationErrors | null {
  return new TextEncoder().encode(String(control.value)).length <= 72 ? null : { bytes: true };
}

function pastDate(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const date = new Date(`${control.value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) || date >= today ? { past: true } : null;
}

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './auth.css',
  template: `
    <section class="login-page">
      <div class="login-card">
        <div class="login-heading">
          <h1>Criar uma conta</h1>
          <p>Cadastre-se e aproveite a experiência mais doce.</p>
        </div>
        <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" novalidate [attr.aria-busy]="busy()">
          <div class="form-field">
            <label for="nome">Nome completo</label>
            <input id="nome" type="text" formControlName="nomeCompleto" autocomplete="name" maxlength="120"
              placeholder="Seu nome completo" [class.input-error]="invalid('nomeCompleto')"
              [attr.aria-invalid]="invalid('nomeCompleto')" aria-describedby="nome-error" />
            @if (invalid('nomeCompleto')) { <small id="nome-error" class="field-error">Informe seu nome, até 120 caracteres.</small> }
          </div>
          <div class="form-field">
            <label for="cadastro-email">E-mail</label>
            <input id="cadastro-email" type="email" formControlName="email" autocomplete="email" maxlength="254"
              placeholder="seuemail@exemplo.com" [class.input-error]="invalid('email')"
              [attr.aria-invalid]="invalid('email')" aria-describedby="cadastro-email-error" />
            @if (invalid('email')) { <small id="cadastro-email-error" class="field-error">Informe um e-mail válido e ainda não cadastrado.</small> }
          </div>
          <div class="form-field">
            <label for="cadastro-senha">Senha</label>
            <input id="cadastro-senha" type="password" formControlName="senha" autocomplete="new-password"
              placeholder="Crie sua senha" [class.input-error]="invalid('senha')"
              [attr.aria-invalid]="invalid('senha')" aria-describedby="cadastro-senha-help cadastro-senha-error" />
            <small id="cadastro-senha-help">Use pelo menos 8 caracteres.</small>
            @if (invalid('senha')) { <small id="cadastro-senha-error" class="field-error">Revise os requisitos da senha.</small> }
          </div>
          <div class="form-field">
            <label for="data-nascimento">Data de nascimento (opcional)</label>
            <input id="data-nascimento" type="date" formControlName="dataNascimento" autocomplete="bday"
              [class.input-error]="invalid('dataNascimento')" [attr.aria-invalid]="invalid('dataNascimento')"
              aria-describedby="data-error" />
            @if (invalid('dataNascimento')) { <small id="data-error" class="field-error">Informe uma data anterior a hoje.</small> }
          </div>
          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          <button type="submit" [disabled]="busy()">{{ busy() ? 'CADASTRANDO…' : 'CADASTRAR' }}</button>
        </form>
        <p class="auth-link">Já tem conta? <a routerLink="/login">Entrar</a></p>
      </div>
    </section>
  `,
})
export class CadastroComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    nomeCompleto: ['', [nonBlank, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    senha: ['', [nonBlank, Validators.minLength(8), passwordBytes]],
    dataNascimento: ['', [pastDate]],
  });

  invalid(field: keyof typeof this.form.controls): boolean {
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
    const value = this.form.getRawValue();
    this.auth.register({
      nomeCompleto: value.nomeCompleto.trim(), email: value.email.toLowerCase(), senha: value.senha,
      ...(value.dataNascimento ? { dataNascimento: value.dataNascimento } : {}),
    }).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => { this.form.controls.senha.reset(); void this.router.navigateByUrl('/'); },
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
}

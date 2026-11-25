import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { Usuario } from '../../core/models';
import { LogadoComponent } from './logado.component';

describe('LogadoComponent', () => {
  let fixture: ComponentFixture<LogadoComponent>;
  let result: Subject<Usuario>;
  const usuario = { id: 1, nomeCompleto: 'Ana Silva', email: 'ana@example.com' };
  const auth = { usuario: signal<Usuario | null>(usuario), updateProfile: vi.fn(), logout: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    auth.usuario.set(usuario);
    result = new Subject<Usuario>();
    auth.updateProfile.mockReturnValue(result);
    await TestBed.configureTestingModule({
      imports: [LogadoComponent], providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
    fixture = TestBed.createComponent(LogadoComponent);
    fixture.detectChanges();
  });

  it('prefills user fields and prevents submitting whitespace or invalid email', () => {
    const component = fixture.componentInstance;
    expect((fixture.nativeElement.querySelector('#perfil-nome') as HTMLInputElement).value).toBe(usuario.nomeCompleto);
    component.form.setValue({ nomeCompleto: '   ', email: 'invalid' });
    component.save();
    fixture.detectChanges();
    expect(auth.updateProfile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBe(2);
  });

  it('offers a text link to the account deletion confirmation', () => {
    const link = fixture.nativeElement.querySelector('a[href="/logado/excluir"]') as HTMLAnchorElement;
    expect(link.textContent).toBe('Excluir minha conta');
    expect(auth.updateProfile).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('submits the form, blocks repeated saves/logout, and announces success', () => {
    const component = fixture.componentInstance;
    const updated = { ...usuario, nomeCompleto: 'Ana Souza' };
    component.form.setValue({ nomeCompleto: ' Ana Souza ', email: usuario.email });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(auth.updateProfile).toHaveBeenCalledWith({ nomeCompleto: 'Ana Souza', email: usuario.email });
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    component.save();
    component.logout();
    expect(auth.updateProfile).toHaveBeenCalledTimes(1);
    expect(auth.logout).not.toHaveBeenCalled();
    result.next(updated);
    result.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Dados atualizados com sucesso.');
    expect(component.form.getRawValue()).toEqual({ nomeCompleto: updated.nomeCompleto, email: updated.email });
    expect(component.saving()).toBe(false);
  });

  it('shows duplicate-email errors and allows correcting the field', () => {
    const component = fixture.componentInstance;
    component.form.controls.email.setValue('taken@example.com');
    component.save();
    result.error(new HttpErrorResponse({
      status: 409, error: { codigo: 'EMAIL_JA_CADASTRADO', mensagem: 'E-mail já cadastrado.' },
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('E-mail já cadastrado.');
    expect(component.invalid('email')).toBe(true);
    expect(component.saving()).toBe(false);
    component.form.controls.email.setValue('available@example.com');
    expect(component.form.controls.email.valid).toBe(true);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const usuario = { id: 1, nomeCompleto: 'Ana Silva', email: 'ana@example.com' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shares session restoration and treats an anonymous 401 as normal', () => {
    auth.restore().subscribe();
    auth.restore().subscribe();
    http.expectOne('/api/v1/sessao').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.usuario()).toBeNull();
    auth.restore().subscribe();
    http.expectNone('/api/v1/sessao');
  });

  it('retries restoration after an outage rather than permanently caching a guest', () => {
    auth.restore().subscribe({ error: () => undefined });
    http.expectOne('/api/v1/sessao').flush({}, { status: 503, statusText: 'Unavailable' });
    auth.restore().subscribe();
    http.expectOne('/api/v1/sessao').flush({ usuario });
    expect(auth.usuario()).toEqual(usuario);
  });

  it('keeps the user authenticated until logout succeeds', () => {
    auth.restore().subscribe();
    http.expectOne('/api/v1/sessao').flush({ usuario });
    auth.logout().subscribe({ error: () => undefined });
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    http.expectOne('/api/v1/sessao').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(auth.usuario()).toEqual(usuario);
  });

  it('deletes the account using CSRF and cookies, then clears the session', () => {
    auth.restore().subscribe();
    http.expectOne('/api/v1/sessao').flush({ usuario });
    auth.deleteAccount().subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    const request = http.expectOne('/api/v1/usuarios/me');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf');
    expect(request.request.withCredentials).toBe(true);
    expect(auth.usuario()).toEqual(usuario);
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.usuario()).toBeNull();
    auth.restore().subscribe();
    http.expectNone('/api/v1/sessao');
  });

  it('preserves the session when deleting the account fails', () => {
    auth.restore().subscribe();
    http.expectOne('/api/v1/sessao').flush({ usuario });
    auth.deleteAccount().subscribe({ error: () => undefined });
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    http.expectOne('/api/v1/usuarios/me').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(auth.usuario()).toEqual(usuario);
  });

  it('does not resurrect a deleted account when an old session read completes', () => {
    auth.restore().subscribe();
    const restoring = http.expectOne('/api/v1/sessao');
    auth.deleteAccount().subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    http.expectOne('/api/v1/usuarios/me').flush(null, { status: 204, statusText: 'No Content' });
    restoring.flush({ usuario });
    expect(auth.usuario()).toBeNull();
  });

  it.each([401, 503])('keeps a successful login when the initial session read fails late with %i', status => {
    let restoredUser: unknown;
    auth.restore().subscribe(user => { restoredUser = user; });
    const restoring = http.expectOne('/api/v1/sessao');
    auth.login(' ANA@example.com ', 'password').subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    const login = http.expectOne('/api/v1/sessao');
    expect(login.request.body).toEqual({ email: 'ana@example.com', senha: 'password' });
    login.flush({ usuario });
    restoring.flush({}, { status, statusText: 'Session read failed' });
    expect(auth.usuario()).toEqual(usuario);
    expect(restoredUser).toEqual(usuario);
  });

  it('does not resurrect a user when a session read arrives after logout', () => {
    let restoredUser: unknown;
    auth.restore().subscribe(user => { restoredUser = user; });
    const restoring = http.expectOne('/api/v1/sessao');
    auth.logout().subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    http.expectOne('/api/v1/sessao').flush(null, { status: 204, statusText: 'No Content' });
    restoring.flush({ usuario });
    expect(auth.usuario()).toBeNull();
    expect(restoredUser).toBeNull();
  });

  it('updates the profile using CSRF and cookies, then updates the current user', () => {
    const updated = { ...usuario, nomeCompleto: 'Ana Souza', email: 'ana.souza@example.com' };
    auth.updateProfile({ nomeCompleto: ' Ana Souza ', email: ' ANA.SOUZA@example.com ' }).subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    const request = http.expectOne('/api/v1/usuarios/me');
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({ nomeCompleto: updated.nomeCompleto, email: updated.email });
    request.flush({ usuario: updated });
    expect(auth.usuario()).toEqual(updated);
  });

  it('preserves profile on a duplicate email error', () => {
    auth.restore().subscribe();
    http.expectOne('/api/v1/sessao').flush({ usuario });
    auth.updateProfile({ nomeCompleto: 'Ana Souza', email: 'taken@example.com' }).subscribe({ error: () => undefined });
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    http.expectOne('/api/v1/usuarios/me').flush({ codigo: 'EMAIL_JA_CADASTRADO' }, { status: 409, statusText: 'Conflict' });
    expect(auth.usuario()).toEqual(usuario);
  });

  it('does not restore an old profile when its response arrives after logout', () => {
    auth.restore().subscribe();
    http.expectOne('/api/v1/sessao').flush({ usuario });
    auth.updateProfile({ nomeCompleto: 'Ana Souza', email: usuario.email }).subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    const update = http.expectOne('/api/v1/usuarios/me');
    auth.logout().subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    http.expectOne('/api/v1/sessao').flush(null, { status: 204, statusText: 'No Content' });
    update.flush({ usuario: { ...usuario, nomeCompleto: 'Ana Souza' } });
    expect(auth.usuario()).toBeNull();
  });

  it('ignores an old session read after a successful profile update', () => {
    auth.restore().subscribe();
    const restore = http.expectOne('/api/v1/sessao');
    auth.updateProfile({ nomeCompleto: 'Ana Souza', email: usuario.email }).subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    const updated = { ...usuario, nomeCompleto: 'Ana Souza' };
    http.expectOne('/api/v1/usuarios/me').flush({ usuario: updated });
    restore.flush({ usuario });
    expect(auth.usuario()).toEqual(updated);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiService } from './api.service';

describe('ApiService session protocol', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends cookie credentials, CSRF and cart concurrency headers together', () => {
    api.request('PATCH', '/carrinho/itens/1', { quantidade: 2 }, { 'If-Match': '"3"' }).subscribe();
    const csrf = http.expectOne('/api/v1/csrf');
    expect(csrf.request.withCredentials).toBe(true);
    csrf.flush({ token: 'session-token', headerName: 'X-CSRF-TOKEN' });
    const patch = http.expectOne('/api/v1/carrinho/itens/1');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.withCredentials).toBe(true);
    expect(patch.request.headers.get('If-Match')).toBe('"3"');
    expect(patch.request.headers.get('X-CSRF-TOKEN')).toBe('session-token');
    expect(patch.request.body).toEqual({ quantidade: 2 });
    patch.flush({});
  });

  it('preserves cart ETag on GET without fetching CSRF', () => {
    let etag: string | null = null;
    api.request('GET', '/carrinho').subscribe(response => { etag = response.headers.get('ETag'); });
    http.expectOne('/api/v1/carrinho').flush({}, { headers: { ETag: '"7"' } });
    expect(etag).toBe('"7"');
  });

  it('obtains a new token after a session-ending mutation', () => {
    api.request('DELETE', '/sessao').subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'old', headerName: 'X-CSRF-TOKEN' });
    http.expectOne('/api/v1/sessao').flush(null, { status: 204, statusText: 'No Content' });
    api.request('POST', '/sessao', { email: 'ana@example.com', senha: 'password' }).subscribe();
    http.expectOne('/api/v1/csrf').flush({ token: 'new', headerName: 'X-CSRF-TOKEN' });
    const login = http.expectOne('/api/v1/sessao');
    expect(login.request.headers.get('X-CSRF-TOKEN')).toBe('new');
    login.flush({});
  });
});

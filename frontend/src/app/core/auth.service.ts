import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AtualizarPerfilRequest, CadastroRequest, Sessao, Usuario } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly currentUser = signal<Usuario | null>(null);
  readonly usuario = this.currentUser.asReadonly();
  private initialized = false;
  private sessionRevision = 0;
  private restoring?: Observable<Usuario | null>;

  restore(): Observable<Usuario | null> {
    if (this.initialized) return of(this.usuario());
    if (this.restoring) return this.restoring;
    const revision = this.sessionRevision;
    this.restoring = this.api.get<Sessao>('/sessao').pipe(
      map(session => session.usuario),
      catchError((error: unknown) => {
        if (revision !== this.sessionRevision) return of(this.usuario());
        return error instanceof HttpErrorResponse && error.status === 401 ? of(null) : throwError(() => error);
      }),
      // An initial session read may complete after login or logout has already changed the session.
      map(user => revision === this.sessionRevision ? user : this.usuario()),
      tap(user => {
        if (revision === this.sessionRevision) {
          this.currentUser.set(user);
          this.initialized = true;
        }
      }),
      finalize(() => { this.restoring = undefined; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.restoring;
  }

  login(email: string, senha: string): Observable<Usuario> {
    return this.authenticate('/sessao', { email: email.trim().toLowerCase(), senha });
  }

  register(request: CadastroRequest): Observable<Usuario> {
    return this.authenticate('/usuarios', request);
  }

  updateProfile(request: AtualizarPerfilRequest): Observable<Usuario> {
    const revision = this.sessionRevision;
    return this.api.request<Sessao>('PUT', '/usuarios/me', {
      nomeCompleto: request.nomeCompleto.trim(), email: request.email.trim().toLowerCase(),
    }).pipe(
      map(response => {
        if (!response.body) throw new Error('Resposta de perfil vazia.');
        return response.body.usuario;
      }),
      tap(user => {
        if (revision === this.sessionRevision) {
          this.sessionRevision++;
          this.currentUser.set(user);
          this.initialized = true;
        }
      }),
    );
  }

  logout(): Observable<void> {
    return this.api.request<void>('DELETE', '/sessao').pipe(
      tap(() => { this.sessionRevision++; this.currentUser.set(null); this.initialized = true; }),
      map(() => undefined),
    );
  }

  deleteAccount(): Observable<void> {
    return this.api.request<void>('DELETE', '/usuarios/me').pipe(
      tap(() => { this.sessionRevision++; this.currentUser.set(null); this.initialized = true; }),
      map(() => undefined),
    );
  }

  private authenticate(path: string, body: unknown): Observable<Usuario> {
    return this.api.request<Sessao>('POST', path, body).pipe(
      map(response => {
        if (!response.body) throw new Error('Resposta de sessão vazia.');
        return response.body.usuario;
      }),
      tap(user => { this.sessionRevision++; this.currentUser.set(user); this.initialized = true; }),
    );
  }
}

import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { ErroApi } from './models';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { providedIn: 'root', factory: () => '/api/v1' });

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL).replace(/\/$/, '');

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.url(path), { withCredentials: true });
  }

  request<T>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Observable<HttpResponse<T>> {
    const send = (requestHeaders: Record<string, string>) => this.http.request<T>(method, this.url(path), {
      body, headers: new HttpHeaders(requestHeaders), withCredentials: true, observe: 'response',
    });
    if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return send(headers);
    // Obtain a fresh token for each intent: logout invalidates the previous session and token.
    return this.get<{ token: string; headerName: string }>('/csrf').pipe(
      switchMap(csrf => send({ ...headers, [csrf.headerName]: csrf.token })),
    );
  }

  private url(path: string): string { return `${this.baseUrl}/${path.replace(/^\//, '')}`; }
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Não foi possível acessar o serviço. Verifique sua conexão e tente novamente.';
    const payload = error.error as Partial<ErroApi> | null;
    if (payload && typeof payload.mensagem === 'string') return payload.mensagem;
    if (error.status === 403) return 'Sua sessão precisa ser atualizada. Tente novamente.';
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}

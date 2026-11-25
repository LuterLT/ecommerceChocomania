import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CatalogService } from './catalog.service';
import { ProdutoResumo } from '../core/models';

describe('CatalogService', () => {
  let http: HttpTestingController;
  let catalog: CatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    catalog = TestBed.inject(CatalogService);
  });

  afterEach(() => http.verify());

  it('loads remaining pages before publishing the complete result', () => {
    let result: ProdutoResumo[] = [];
    catalog.list('a & b').subscribe(items => { result = items; });
    const first = http.expectOne('/api/v1/produtos?tamanho=100&pagina=1&busca=a%20%26%20b');
    expect(first.request.withCredentials).toBe(true);
    first.flush({ itens: [{ id: 1 }], pagina: 1, tamanho: 100, total: 101 });
    expect(result).toEqual([]);
    http.expectOne('/api/v1/produtos?tamanho=100&pagina=2&busca=a%20%26%20b')
      .flush({ itens: [{ id: 101 }], pagina: 2, tamanho: 100, total: 101 });
    expect(result.map(item => item.id)).toEqual([1, 101]);
  });

  it('cancels the in-flight HTTP request when a search is replaced', () => {
    const subscription = catalog.list('chocolate').subscribe();
    const request = http.expectOne('/api/v1/produtos?tamanho=100&pagina=1&busca=chocolate');
    subscription.unsubscribe();
    expect(request.cancelled).toBe(true);
  });
});

import { inject, Injectable } from '@angular/core';
import { EMPTY, expand, Observable, reduce } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Pagina, ProdutoResumo } from '../core/models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);

  list(busca = ''): Observable<ProdutoResumo[]> {
    const page = (pagina: number) => this.api.get<Pagina<ProdutoResumo>>(
      `/produtos?tamanho=100&pagina=${pagina}&busca=${encodeURIComponent(busca)}`,
    );
    return page(1).pipe(
      expand(result => result.pagina * result.tamanho < result.total ? page(result.pagina + 1) : EMPTY),
      reduce((items, result) => [...items, ...result.itens], [] as ProdutoResumo[]),
    );
  }
}

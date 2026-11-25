import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `<section class="page-message"><h1>Página não encontrada</h1><p>O endereço solicitado não existe.</p><a routerLink="/">Voltar às compras</a></section>`,
})
export class NotFoundComponent {}

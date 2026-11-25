import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guards';

export const routes: Routes = [
  { path: '', title: 'Chocomania', loadComponent: () => import('./pages/catalog/vitrine.component').then(m => m.VitrineComponent) },
  { path: 'resultado-busca', title: 'Busca | Chocomania', loadComponent: () => import('./pages/catalog/resultado-busca.component').then(m => m.ResultadoBuscaComponent) },
  { path: 'produto/:id', title: 'Produto | Chocomania', loadComponent: () => import('./pages/catalog/produto.component').then(m => m.ProdutoComponent) },
  { path: 'carrinho', title: 'Carrinho | Chocomania', loadComponent: () => import('./pages/cart/carrinho.component').then(m => m.CarrinhoComponent) },
  { path: 'login', canActivate: [guestGuard], title: 'Login | Chocomania', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent) },
  { path: 'cadastro', canActivate: [guestGuard], title: 'Cadastro | Chocomania', loadComponent: () => import('./pages/auth/cadastro.component').then(m => m.CadastroComponent) },
  { path: 'logado/excluir', canActivate: [authGuard], title: 'Excluir conta | Chocomania', loadComponent: () => import('./pages/auth/excluir-conta.component').then(m => m.ExcluirContaComponent) },
  { path: 'logado', canActivate: [authGuard], title: 'Minha conta | Chocomania', loadComponent: () => import('./pages/auth/logado.component').then(m => m.LogadoComponent) },
  { path: '**', title: 'Página não encontrada | Chocomania', loadComponent: () => import('./not-found.component').then(m => m.NotFoundComponent) },
];

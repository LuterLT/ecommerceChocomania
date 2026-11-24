export interface Categoria { id: number; nome: string; ordem: number; }
export interface ProdutoResumo {
  id: number;
  categoriaId: number;
  titulo: string;
  imagemUrl: string;
  precoBaseCentavos: number;
  descontoPercentual: number;
  precoFinalCentavos: number;
  estoqueDisponivel: number;
}
export interface ProdutoDetalhe extends ProdutoResumo { descricao: string; categoria: Categoria; }
export interface Pagina<T> { itens: T[]; pagina: number; tamanho: number; total: number; }
export interface ItemCarrinho {
  produtoId: number;
  titulo: string;
  imagemUrl: string;
  quantidade: number;
  estoqueDisponivel: number;
  precoBaseCentavos: number;
  precoFinalCentavos: number;
  totalCentavos: number;
  situacao: 'DISPONIVEL' | 'ESTOQUE_INSUFICIENTE' | 'INDISPONIVEL';
}
export interface Carrinho {
  id: string;
  versao: number;
  moeda: string;
  itens: ItemCarrinho[];
  subtotalCentavos: number;
  descontoCentavos: number;
  totalCentavos: number;
}
export interface Usuario { id: number; nomeCompleto: string; email: string; }
export interface Pedido { id: number; totalCentavos: number; carrinho: Carrinho; }
export interface Sessao { usuario: Usuario; }
export interface AtualizarPerfilRequest { nomeCompleto: string; email: string; }
export interface CadastroRequest { nomeCompleto: string; email: string; senha: string; dataNascimento?: string; }
export interface ErroApi { codigo: string; mensagem: string; campos?: Record<string, string>; }

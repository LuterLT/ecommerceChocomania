import type { Produto } from "./Produtos";

export interface ItemsCarrinho extends Produto {
	qtd: number;
}

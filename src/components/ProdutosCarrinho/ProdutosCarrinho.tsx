import { Trash2 } from "lucide-react";
import type { ItemsCarrinho } from "../../models/ItemsCarrinho";
import "./ProdutosCarrinho.css";

interface ProdutosCarrinhoProps {
	item: ItemsCarrinho;
	onAlterarQuantidade: (id: number, qtd: number) => void;
	onRemover: (id: number) => void;
}

function ProdutosCarrinho({ item, onAlterarQuantidade, onRemover }: ProdutosCarrinhoProps) {
	const precoComDesconto = item.preco * ((100 - item.desconto) / 100);

	return (
		<article className="item-carrinho">
			<img src={item.imagem} alt={item.titulo} className="item-carrinho-imagem" />
			<div className="item-carrinho-informacoes">
				<h2>{item.titulo}</h2>
				{item.desconto > 0 ? (
					<div className="item-carrinho-precos">
						<span className="item-carrinho-preco-original">R$ {item.preco.toFixed(2)}</span>
						<span className="item-carrinho-preco-desconto">R$ {precoComDesconto.toFixed(2)}</span>
					</div>
				) : (
					<span className="item-carrinho-preco">R$ {item.preco.toFixed(2)}</span>
				)}
			</div>
			<div className="item-carrinho-acoes">
				<div className="item-carrinho-quantidade" aria-label={`Quantidade de ${item.titulo}`}>
					<button type="button" aria-label="Diminuir quantidade" onClick={() => onAlterarQuantidade(item.id, item.qtd - 1)}>−</button>
					<span>{item.qtd}</span>
					<button type="button" aria-label="Aumentar quantidade" onClick={() => onAlterarQuantidade(item.id, item.qtd + 1)}>+</button>
				</div>
				<button type="button" className="item-carrinho-remover" aria-label={`Remover ${item.titulo}`} onClick={() => onRemover(item.id)}>
					<Trash2 size={20} aria-hidden="true" />
				</button>
			</div>
		</article>
	);
}

export default ProdutosCarrinho;

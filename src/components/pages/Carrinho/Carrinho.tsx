import { useState } from "react";
import { Link } from "react-router-dom";
import ProdutosCarrinho from "../../ProdutosCarrinho/ProdutosCarrinho";
import type { ItemsCarrinho } from "../../../models/ItemsCarrinho";
import "./Carrinho.css";

function Carrinho() {
    const [itens, setItens] = useState<ItemsCarrinho[]>(() => {
        const itensSalvos = JSON.parse(localStorage.getItem("carrinho") ?? "[]") as ItemsCarrinho[];
        return itensSalvos.map((item) => ({ ...item, qtd: item.qtd ?? item.quantidade ?? 1 }));
    });

    const salvarItens = (novosItens: ItemsCarrinho[]) => {
        setItens(novosItens);
        localStorage.setItem("carrinho", JSON.stringify(novosItens));
    };

    const alterarQuantidade = (id: number, qtd: number) => {
        const item = itens.find((produto) => produto.id === id);
        if (!item) return;
        salvarItens(itens.map((produto) => produto.id === id
            ? { ...produto, qtd: Math.max(1, Math.min(qtd, produto.quantidade)) }
            : produto));
    };

    const removerItem = (id: number) => salvarItens(itens.filter((item) => item.id !== id));

    const subtotal = itens.reduce((total, item) => total + item.preco * item.qtd, 0);
    const totalComDesconto = itens.reduce((total, item) => total + (item.preco * ((100 - item.desconto) / 100)) * item.qtd, 0);
    const descontos = subtotal - totalComDesconto;
    const formatarPreco = (valor: number) => `R$ ${valor.toFixed(2)}`;

    if (itens.length === 0) {
        return (
            <section className="carrinho-vazio">
                <h1>Carrinho vazio</h1>
                <Link to="/" className="carrinho-link-compras">Ir as compras</Link>
            </section>
        );
    }

    return (
        <section className="carrinho-pagina">
            <h1>Meu carrinho</h1>
            <div className="carrinho-conteudo">
                <div className="carrinho-itens">
                    {itens.map((item) => (
                        <ProdutosCarrinho key={item.id} item={item} onAlterarQuantidade={alterarQuantidade} onRemover={removerItem} />
                    ))}
                </div>
                <aside className="carrinho-resumo">
                    <h2>Resumo da compra</h2>
                    <div><span>Subtotal</span><strong>{formatarPreco(subtotal)}</strong></div>
                    <div><span>Descontos</span><strong className="carrinho-desconto">- {formatarPreco(descontos)}</strong></div>
                    <div className="carrinho-total"><span>Total</span><strong>{formatarPreco(totalComDesconto)}</strong></div>
                    <button type="button" className="botao-prosseguir">Prosseguir</button>
                </aside>
            </div>
        </section>
    );
}

export default Carrinho;
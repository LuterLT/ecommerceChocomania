import { useState } from "react";
import { useParams } from "react-router-dom";
import { produtos } from "../../../models/Produtos";
import "./Produto.css";

interface ProdutoProps {
    id?: number;
}

function Produto({ id: idProp }: ProdutoProps) {
    const { id: idDaRota } = useParams();
    const produto = produtos.find((item) => item.id === (idProp ?? Number(idDaRota)));
    const [quantidade, setQuantidade] = useState(1);

    if (!produto) {
        return <p className="produto-nao-encontrado">Produto não encontrado.</p>;
    }

    const precoComDesconto = produto.preco * ((100 - produto.desconto) / 100);

    const adicionarAoCarrinho = () => {
        const carrinho = JSON.parse(localStorage.getItem("carrinho") ?? "[]");
        const itemExistente = carrinho.find((item: { id: number }) => item.id === produto.id);

        if (itemExistente) {
            itemExistente.qtd = Math.min((itemExistente.qtd ?? itemExistente.quantidade ?? 0) + quantidade, produto.quantidade);
        } else {
            carrinho.push({ ...produto, qtd: quantidade });
        }

        localStorage.setItem("carrinho", JSON.stringify(carrinho));
        alert("Produto adicionado ao carrinho com sucesso");
    };

    return (
        <section className="produto-detalhe">
            <div className="produto-imagem-container">
                <img src={produto.imagem} alt={produto.titulo} className="produto-imagem" />
            </div>
            <div className="produto-informacoes">
                <h1>{produto.titulo}</h1>
                <p className="produto-descricao">{produto.descricao}</p>
                <div className="produto-preco">
                    {produto.desconto > 0 ? (
                        <>
                            <span className="preco-original">R$ {produto.preco.toFixed(2)}</span>
                            <span className="preco-desconto">R$ {precoComDesconto.toFixed(2)}</span>
                        </>
                    ) : (
                        <span>R$ {produto.preco.toFixed(2)}</span>
                    )}
                </div>
                <p className="produto-estoque">Categoria: {produto.categoria}</p>
                <div className="produto-acoes">
                    <div className="controle-quantidade" aria-label="Quantidade do produto">
                        <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantidade((atual) => Math.max(1, atual - 1))}>−</button>
                        <span>{quantidade}</span>
                        <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantidade((atual) => Math.min(produto.quantidade, atual + 1))}>+</button>
                    </div>
                    <button type="button" className="botao-carrinho" onClick={adicionarAoCarrinho}>
                        <span aria-hidden="true">🛍</span> Adicionar ao carrinho
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Produto;
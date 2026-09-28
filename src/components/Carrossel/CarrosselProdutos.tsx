import { useRef } from "react";
import { Link } from "react-router-dom";
import {produtos} from "../../models/Produtos";
import "./CarrosselProdutos.css"

interface CarrosselProdutosProps {
    categoria: string;
}

function CarrosselProdutos({ categoria }: CarrosselProdutosProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const moverCarrossel = (direcao: number) => sliderRef.current?.scrollBy({
        left: direcao * 320,
        behavior: "smooth"
    });

    return (
        <div className="carrossel-produtos relative bg-[#804828]">
            <h2 className="carrossel-categoria">Categoria: {categoria}</h2>
                <button
                    type="button"
                    aria-label="Produtos anteriores"
                    onClick={() => moverCarrossel(-1)}
                    className="absolute left-2 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-[#3b170f] p-0 text-4xl leading-none text-[#fff0bd] transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer md:flex"
                >
                    <span className="mb-2">‹</span>
                </button>
                <div ref={sliderRef}
                className="carrossel-scrollbar-hidden relative flex h-full w-full flex-row items-center gap-4 overflow-x-scroll scroll whitespace-nowrap scroll-smooth pl-4 pr-4 pt-5 pb-5">
                    {produtos.filter((item) => item.categoria === categoria).map((item)=> {
                        const precoComDesconto = item.preco * ((100 - item.desconto) / 100);

                        return (
                            <Link
                            key={item.id}
                            to={`/produto/${item.id}`}
                            className="carrossel-card hover:scale-105 ease-in-out duration-300 flex h-full w-75 shrink-0 cursor-pointer flex-col items-center gap-3 rounded-lg bg-[#f4c96d] p-5 justify-between pb-10">
                                <img src={item.imagem} alt={item.titulo} className="carrossel-card-imagem h-45 w-55 object-cover" />
                                <h2 className="carrossel-card-titulo w-full text-center text-2xl font-semibold whitespace-normal">{item.titulo}</h2>
                                {item.desconto > 0 ? (
                                    <div className="carrossel-card-precos flex items-center gap-2 text-lg whitespace-nowrap">
                                        <span className="text-gray-500 line-through">
                                            R$ {item.preco.toFixed(2)}
                                        </span>
                                        <span className="carrossel-card-preco text-2xl font-bold text-red-600">
                                            R$ {precoComDesconto.toFixed(2)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="carrossel-card-preco text-2xl font-bold">
                                        R$ {item.preco.toFixed(2)}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
                <button
                    type="button"
                    aria-label="Próximos produtos"
                    onClick={() => moverCarrossel(1)}
                    className="absolute right-2 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-[#3b170f] p-0 text-4xl leading-none text-[#fff0bd] transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer md:flex"
                >
                    <span className="mb-2">›</span>
                </button>
        </div>
    )
}

export default CarrosselProdutos;
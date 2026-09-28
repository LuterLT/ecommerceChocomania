import { Link, useSearchParams } from "react-router-dom";
import { produtos } from "../../../models/Produtos";
import "./ResultadoBusca.css";

function ResultadoBusca() {
	const [parametros] = useSearchParams();
	const busca = parametros.get("busca")?.trim() ?? "";
	const termo = busca.toLowerCase();
	const resultados = produtos.filter((item) =>
		item.titulo.toLowerCase().includes(termo)
	);

	return (
		<section className="resultado-busca">
			<h1>Resultados para: {busca || "todos os produtos"}</h1>
			{resultados.length > 0 ? (
				<div className="resultado-busca-lista">
					{resultados.map((item) => {
						const precoComDesconto = item.preco * ((100 - item.desconto) / 100);

						return (
							<Link
								key={item.id}
								to={`/produto/${item.id}`}
								className="resultado-busca-card hover:scale-105 ease-in-out duration-300"
							>
								<img src={item.imagem} alt={item.titulo} />
								<h2>{item.titulo}</h2>
								{item.desconto > 0 ? (
									<div className="flex items-center gap-2 text-lg whitespace-nowrap">
										<span className="text-gray-500 line-through">R$ {item.preco.toFixed(2)}</span>
										<span className="text-2xl font-bold text-red-600">R$ {precoComDesconto.toFixed(2)}</span>
									</div>
								) : (
									<span className="text-2xl font-bold">R$ {item.preco.toFixed(2)}</span>
								)}
							</Link>
						);
					})}
				</div>
			) : (
				<p className="resultado-busca-vazio">Nenhum produto encontrado.</p>
			)}
		</section>
	);
}

export default ResultadoBusca;

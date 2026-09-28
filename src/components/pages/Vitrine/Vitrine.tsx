import CarrosselProdutos from '../../Carrossel/CarrosselProdutos'
import "./Vitrine.css"

function Vitrine() {
    const categorias = [
        "Chocolates em Barra",
        "Bombons",
        "Trufas",
        "Bebidas e Cremes de Chocolate"
    ]

    return (
    <>
        {categorias.map((categoria) => (
            <section key={categoria}>
                <CarrosselProdutos categoria={categoria} />
            </section>
        ))}
    </>
    )
}
export default Vitrine
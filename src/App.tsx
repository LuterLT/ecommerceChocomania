import './App.css'
import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import Vitrine from "./components/pages/Vitrine/Vitrine";
import Carrinho from "./components/pages/Carrinho/Carrinho";
import Login from "./components/pages/Login/Login";
import Cadastro from "./components/pages/Cadastro/Cadastro";
import Logado from "./components/pages/Logado/Logado";
import Produto from "./components/pages/Produto/Produto";
import ResultadoBusca from "./components/pages/ResultadoBusca/ResultadoBusca";

function Header() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const pesquisar = (valor: string) => {
    const busca = valor.trim();
    navigate(busca ? `/resultado-busca?busca=${encodeURIComponent(busca)}` : "/");
  };

  return (
    <header className="site-header">
      <div className="header-content">
        <a className="brand" href="/" aria-label="Chocomania - página inicial">
          <span className="brand-script">CHOCOMANIA</span>
          <span className="brand-tagline">um pedacinho de felicidade</span>
        </a>

        <form className="search-form" role="search" onSubmit={(event) => {
          event.preventDefault();
          pesquisar(busca);
        }}>
          <label className="sr-only" htmlFor="product-search">Pesquisar chocolates</label>
          <input
            id="product-search"
            type="search"
            placeholder="O que você está procurando?"
            value={busca}
            onChange={(event) => {
              setBusca(event.target.value);
              pesquisar(event.target.value);
            }}
          />
          <button type="submit" aria-label="Pesquisar">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </div>
      <nav className="site-nav">
        <span className="sr-only">Menu de navegação</span>
        <ul className="nav-links">
          <li><Link to="/">Início</Link></li>
          <li><Link to="/carrinho">Carrinho</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/cadastro">Cadastro</Link></li>
        </ul>
      </nav>
    </header>
  );
}

function App() {

  return (
    <>
    <BrowserRouter>
      <Header />
      <main className="w-full">
        <Routes>
          <Route path="/" element={<Vitrine />} />
          <Route path="/produto/:id" element={<Produto />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/logado" element={<Logado />} />
          <Route path="/resultado-busca" element={<ResultadoBusca />} />
        </Routes>
      </main>
      <footer className="site-footer mt-10 ">
        <div className="footer-content">
          <div className="footer-brand">
            <strong>CHOCOMANIA</strong>
            <p>Um pedacinho de felicidade em cada mordida.</p>
          </div>
          <div className="footer-column">
            <h2>Atendimento</h2>
            <p>Seg a sex, das 9h às 18h</p>
            <p>(11) 0000-0000</p>
          </div>
          <div className="footer-column">
            <h2>Fale conosco</h2>
            <a href="mailto:ola@chocomania.com.br">ola@chocomania.com.br</a>
            <p>Rua do Cacau, 120 - São Paulo</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Chocomania. Todos os direitos reservados.</p>
        </div>
      </footer>
    </BrowserRouter>
    </>
  )
}

export default App

import { Navigate, useNavigate } from "react-router-dom";
import { obterUsuarios, salvarUsuarios, type Usuarios } from "../../../models/Usuarios";
import "../Login/Login.css";

function Logado() {
    const navigate = useNavigate();
    const usuarioSalvo = JSON.parse(localStorage.getItem("usuarioLogado") ?? "null") as Usuarios | null;
    const usuarioLogado = usuarioSalvo?.logado ? usuarioSalvo : undefined;

    if (!usuarioLogado) return <Navigate to="/login" replace />;

    const sairDaConta = () => {
        const usuarioDeslogado = { ...usuarioLogado, logado: false };
        salvarUsuarios(obterUsuarios().map((usuario) => usuario.id === usuarioDeslogado.id ? usuarioDeslogado : usuario));
        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioDeslogado));
        alert("Você saiu da conta");
        navigate("/login");
    };

    return (
        <section className="login-page">
            <div className="login-card">
                <div className="login-heading logged-in-message">
                    <h1>Bem-Vindo {usuarioLogado.nome}</h1>
                    <p>Você já está logado</p>
                    <button type="button" className="logout-link" onClick={sairDaConta}>Sair da conta</button>
                </div>
            </div>
        </section>
    );
}

export default Logado;

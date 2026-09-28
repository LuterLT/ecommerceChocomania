import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { obterUsuarios, salvarUsuarios, type Usuarios } from "../../../models/Usuarios";
import "./Login.css"

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erros, setErros] = useState({ email: false, senha: false });
    const usuarioSalvo = JSON.parse(localStorage.getItem("usuarioLogado") ?? "null") as Usuarios | null;
    const usuarioLogado = usuarioSalvo?.logado ? usuarioSalvo : undefined;

    if (usuarioLogado) return <Navigate to="/logado" replace />;

    const fazerLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const listaUsuarios = obterUsuarios();
        const usuario = listaUsuarios.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
        const emailInvalido = !/^\S+@\S+\.\S+$/.test(email) || !usuario;
        const senhaInvalida = !senha || (usuario !== undefined && usuario.senha !== senha);

        setErros({ email: emailInvalido, senha: senhaInvalida });

        if (emailInvalido) {
            alert("Email inválido ou não cadastrado");
            return;
        }
        if (senhaInvalida) {
            alert("Senha incorreta");
            return;
        }

        const usuarioPersistido = { ...usuario, logado: true };
        salvarUsuarios(listaUsuarios.map((item) => item.id === usuario.id ? usuarioPersistido : { ...item, logado: false }));
        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioPersistido));
        alert("Login realizado com sucesso");
        navigate("/");
    };

    return (
        <section className="login-page">
            <div className="login-card">
                <div className="login-heading">
                    <h1>Entrar na Chocomania</h1>
                    <p>Acesse sua conta e continue sua experiência mais doce.</p>
                </div>

                <form className="login-form" noValidate onSubmit={fazerLogin}>
                    <div className="form-field">
                        <label htmlFor="email">E-mail</label>
                        <input
                            className={erros.email ? "input-error" : ""}
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setErros((estado) => ({ ...estado, email: false }));
                            }}
                            placeholder="seuemail@exemplo.com"
                            aria-invalid={erros.email}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="password">Senha</label>
                        <input
                            className={erros.senha ? "input-error" : ""}
                            id="password"
                            name="password"
                            type="password"
                            value={senha}
                            onChange={(event) => {
                                setSenha(event.target.value);
                                setErros((estado) => ({ ...estado, senha: false }));
                            }}
                            placeholder="Digite sua senha"
                            aria-invalid={erros.senha}
                        />
                    </div>

                    <button type="submit">LOGAR</button>
                </form>
            </div>
        </section>
    )
}

export default Login;
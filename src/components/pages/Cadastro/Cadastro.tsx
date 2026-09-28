import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { obterUsuarios, salvarUsuarios, type Usuarios } from "../../../models/Usuarios";
import "./Cadastro.css";

function Cadastro() {
    const navigate = useNavigate();
    const [dados, setDados] = useState({ nome: "", email: "", senha: "", dataNascimento: "" });
    const [erros, setErros] = useState({ nome: false, email: false, senha: false, dataNascimento: false });
    const usuarioLogadoSalvo = JSON.parse(localStorage.getItem("usuarioLogado") ?? "null") as Usuarios | null;
    const usuarioLogado = usuarioLogadoSalvo?.logado ? usuarioLogadoSalvo : undefined;

    if (usuarioLogado) return <Navigate to="/logado" replace />;

    const cadastrar = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const emailValido = /^\S+@\S+\.\S+$/.test(dados.email);
        const listaUsuarios = obterUsuarios();
        const emailCadastrado = listaUsuarios.some((usuario) => usuario.email.toLowerCase() === dados.email.trim().toLowerCase());
        const novosErros = {
            nome: !dados.nome.trim(),
            email: !emailValido || emailCadastrado,
            senha: !dados.senha,
            dataNascimento: !dados.dataNascimento
        };

        setErros(novosErros);
        if (Object.values(novosErros).some(Boolean)) {
            alert(emailCadastrado ? "Email já cadastrado" : "Preencha todos os campos corretamente");
            return;
        }

        const novoUsuario: Usuarios = {
            id: Math.max(...listaUsuarios.map((usuario) => usuario.id), 0) + 1,
            ...dados,
            logado: true
        };

        salvarUsuarios([...listaUsuarios.map((usuario) => ({ ...usuario, logado: false })), novoUsuario]);
        localStorage.setItem("usuarioLogado", JSON.stringify(novoUsuario));
        alert("Cadastro realizado com sucesso");
        navigate("/");
    };

    const alterarCampo = (campo: keyof typeof dados, valor: string) => {
        setDados((estado) => ({ ...estado, [campo]: valor }));
        setErros((estado) => ({ ...estado, [campo]: false }));
    };

    return (
        <section className="cadastro-page">
            <div className="cadastro-card">
                <div className="cadastro-heading">
                    <h1>Criar uma conta</h1>
                    <p>Cadastre-se e aproveite a experiência mais doce.</p>
                </div>

                <form className="cadastro-form" noValidate onSubmit={cadastrar}>
                    <div className="cadastro-field">
                        <label htmlFor="nome">Nome</label>
                        <input className={erros.nome ? "cadastro-input-error" : ""} id="nome" type="text" value={dados.nome} onChange={(event) => alterarCampo("nome", event.target.value)} placeholder="Seu nome completo" />
                    </div>
                    <div className="cadastro-field">
                        <label htmlFor="cadastro-email">E-mail</label>
                        <input className={erros.email ? "cadastro-input-error" : ""} id="cadastro-email" type="email" value={dados.email} onChange={(event) => alterarCampo("email", event.target.value)} placeholder="seuemail@exemplo.com" />
                    </div>
                    <div className="cadastro-field">
                        <label htmlFor="cadastro-senha">Senha</label>
                        <input className={erros.senha ? "cadastro-input-error" : ""} id="cadastro-senha" type="password" value={dados.senha} onChange={(event) => alterarCampo("senha", event.target.value)} placeholder="Digite sua senha" />
                    </div>
                    <div className="cadastro-field">
                        <label htmlFor="data-nascimento">Data de nascimento</label>
                        <input className={erros.dataNascimento ? "cadastro-input-error" : ""} id="data-nascimento" type="date" value={dados.dataNascimento} onChange={(event) => alterarCampo("dataNascimento", event.target.value)} />
                    </div>
                    <button type="submit">CADASTRAR</button>
                </form>
            </div>
        </section>
    )
}

export default Cadastro;
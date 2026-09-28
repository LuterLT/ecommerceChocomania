export interface Usuarios {
    id: number;
    nome: string;
    email: string;
    senha: string;
    dataNascimento: string;
    logado: boolean;
}

export const usuarios: Usuarios[] = [
    {
        id: 1,
        nome: "Lucas Almeida",
        email: "lucas.almeida@email.com",
        senha: "Lucas@123",
        dataNascimento: "2004-03-15",
        logado: false
    },
    {
        id: 2,
        nome: "Mariana Santos",
        email: "mariana.santos@email.com",
        senha: "Mariana@456",
        dataNascimento: "2003-07-22",
        logado: false
    },
    {
        id: 3,
        nome: "Gabriel Oliveira",
        email: "gabriel.oliveira@email.com",
        senha: "Gabriel@789",
        dataNascimento: "2005-11-08",
        logado: false
    },
    {
        id: 4,
        nome: "Ana Beatriz Costa",
        email: "ana.costa@email.com",
        senha: "Ana@321",
        dataNascimento: "2002-01-30",
        logado: false   
    },
    {
        id: 5,
        nome: "Rafael Martins",
        email: "rafael.martins@email.com",
        senha: "Rafael@654",
        dataNascimento: "2004-09-17",
        logado: false
    },
    {
        id: 6,
        nome: "admin",
        email: "admin@email.com",
        senha: "admin",
        dataNascimento: "1967-06-07",
        logado: false
    }
];

export function obterUsuarios(): Usuarios[] {
    const usuariosSalvos = localStorage.getItem("usuarios");
    return usuariosSalvos ? JSON.parse(usuariosSalvos) as Usuarios[] : usuarios;
}

export function salvarUsuarios(lista: Usuarios[]) {
    localStorage.setItem("usuarios", JSON.stringify(lista));
}


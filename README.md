# Chocomania

Loja em Angular 22 e TypeScript, com API Java 21/Spring Boot e PostgreSQL.

## Executar

Na raiz, inicie frontend, API e banco:

```sh
docker compose up --build -d --wait
```

Abra http://127.0.0.1:5173. O frontend é compilado e servido pelo nginx, que encaminha `/api/**` para a API na rede Docker. Rotas como `/carrinho` e `/produto/1` também funcionam ao abrir diretamente ou atualizar a página. O Compose aguarda a saúde do banco e da API antes de iniciar o frontend.

Para acompanhar os serviços:

```sh
docker compose ps
docker compose logs -f
```

Para desenvolver o frontend com atualização automática, mantenha API e banco no Docker e execute Angular localmente:

```sh
docker compose up --build -d --wait api
cd frontend
npm ci
npm run dev
```

Se o frontend Docker estiver ativo, pare-o antes com `docker compose stop frontend` para liberar a porta 5173. O servidor Angular encaminha `/api/**` para `http://127.0.0.1:8080`; ajuste `frontend/proxy.conf.json` se a porta da API mudar.

A API aplica migrations e disponibiliza os 40 produtos. Contas e carrinhos autenticados ficam no banco; sessões ficam em memória. Não existem contas de demonstração.

## Verificar

```sh
cd frontend
npm run build
npm test
```

O build de produção fica em `frontend/dist/chocomania/browser`. Consulte [frontend/README.md](frontend/README.md) para arquitetura e hospedagem e [backend/README.md](backend/README.md) para contratos da API.

Copie `.env.example` para `.env` para personalizar portas e credenciais. `FRONTEND_PORT` define a porta da loja; `API_PORT` e `DB_PORT` controlam o acesso local direto à API e ao PostgreSQL. Os containers usam os nomes e portas internos, independentemente desses valores. Credenciais padrão destinam-se ao desenvolvimento local. As portas são publicadas apenas em `127.0.0.1`. `docker compose down` preserva o volume do banco; não use `down -v` se quiser manter os dados.

## Escopo

Catálogo, busca, detalhe, carrinho de visitante/conta, cadastro, login, edição do perfil e logout integrados à API. Em **Minha conta** (`/logado`), o usuário pode atualizar nome completo e e-mail pelo endpoint `PUT /api/v1/usuarios/me`, autenticado por sessão e protegido por CSRF. O servidor calcula preços, descontos, estoque e totais em centavos. O frontend usa cookies de sessão, CSRF, ETag e idempotência nas operações de carrinho; não armazena senhas no navegador.

O [guia resumido do projeto](output/pdf/guia-api-chocomania.pdf) explica a arquitetura, execução local, contratos HTTP, edição do perfil e acesso ao banco.

Checkout, pagamento, telefone/endereço e recuperação de senha não estão implementados no backend atual. A especificação [FRONTEND_MIGRATION_SPEC.md](FRONTEND_MIGRATION_SPEC.md) registra o diagnóstico anterior e propostas futuras; não substitui os contratos implementados.

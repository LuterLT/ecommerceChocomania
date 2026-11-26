# Chocomania — Angular

SPA Angular 22 com componentes standalone, signals, rotas lazy e formulários reativos. Node.js deve atender à versão Angular instalada (por exemplo, Node 24.18); as versões exatas das dependências estão em `package-lock.json`.

## Desenvolvimento

```sh
npm ci
npm run dev
```

Acesse http://127.0.0.1:5173 com a API ativa em `http://127.0.0.1:8080`. O proxy em `proxy.conf.json` mantém frontend e API na mesma origem do navegador e encaminha os cookies de sessão. `npm run preview` serve a configuração de produção pelo servidor Angular para verificação local; não substitui hospedagem de produção.

```sh
npm run check
npm run build
npm test
```

`check` compila templates e TypeScript em desenvolvimento. `build` gera produção em `dist/chocomania/browser`. `test` executa testes HTTP com Vitest, sem alterar o banco.

## Organização

- `src/app/core`: DTOs da API, cliente HTTP com credenciais e CSRF, sessão e guards.
- `src/app/shared`: cartões, resolução de imagens e consultas paginadas do catálogo.
- `src/app/pages/catalog`: vitrine, pesquisa e detalhe.
- `src/app/pages/cart`: estado do carrinho, ETag, idempotência, controles e resumo.
- `src/app/pages/auth`: login, cadastro e conta.
- `src/app/app.component.*`: cabeçalho, busca sincronizada com a URL e rodapé.

Rotas: `/`, `/resultado-busca?busca=...`, `/produto/:id`, `/carrinho`, `/login`, `/cadastro`, `/logado`, `/logado/excluir` e página de endereço inexistente. A busca aguarda 300 ms, cancela consultas anteriores e substitui o histórico durante a digitação. Carrinho e catálogo possuem estados de carregamento, erro e vazio. Erros de concorrência atualizam o carrinho sem repetir automaticamente a alteração.

Dados e sessão vêm exclusivamente da API. Nenhum dado das antigas chaves locais `usuarios`, `usuarioLogado` ou `carrinho` é importado. Cadastro utiliza apenas os campos aceitos pelo backend: nome, e-mail, senha e nascimento opcional. A ação **Realizar pedido** exige login e envia `POST /api/v1/pedidos` com CSRF e `If-Match`; o sucesso confirma o identificador do pedido e atualiza o carrinho vazio. Não há pagamento nem baixa de estoque.

Após entrar, acesse **Minha conta** (`/logado`) para editar nome e e-mail. O formulário envia `PUT /api/v1/usuarios/me` com `{ nomeCompleto, email }`, cookies de sessão e token CSRF. O retorno `{ usuario }` atualiza o estado da sessão e a saudação sem recarregar a página. A tela valida campos obrigatórios, nome com até 120 caracteres e e-mail válido com até 254 caracteres; apresenta confirmação ou erro e impede envios repetidos durante a operação. Senha e data de nascimento não são editadas nesse formulário.

## Hospedagem

O `Dockerfile` compila a aplicação com Node 24 e serve os arquivos pelo nginx. Na raiz do repositório, `docker compose up --build -d --wait` inicia frontend, API e PostgreSQL. Acesse http://127.0.0.1:5173 (ou a porta definida em `FRONTEND_PORT`). O nginx encaminha `/api/**` para `api:8080`, preserva cookies e cabeçalhos de sessão e aplica o fallback de navegação apenas fora da API. `/healthz` verifica o servidor estático.

Sirva `dist/chocomania/browser` como arquivos estáticos. Configure fallback de rotas de navegação para `index.html` e um reverse proxy `/api/v1` para o backend. Não aplique o fallback às rotas da API. Use HTTPS e `COOKIE_SECURE=true` no backend em produção.

Para publicar sob subcaminho, gere com `npm run build -- --base-href /loja/` e mantenha a API em `/api/v1`, ou altere o provider `API_BASE_URL` em `src/main.ts` para a URL desejada. Em origens distintas, configure CORS com credenciais e cookies compatíveis no backend. As imagens do catálogo são resolvidas pela base da aplicação; arquivos existentes em `public/` são preservados.

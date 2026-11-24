# Chocomania API

Backend simples com Java 21, Spring Boot 3.5, Maven, JDBC, PostgreSQL 17 e migrations Flyway. Sem JPA ou serviços externos.

## Executar

Na raiz do repositório:

```sh
docker compose up --build -d --wait
```

O build executa os testes unitários. A API inicia depois do healthcheck do banco e aplica as migrations automaticamente.

- API: `http://localhost:8080/api/v1`
- Saúde: `http://localhost:8080/actuator/health`
- PostgreSQL local: `localhost:5432`, banco e usuário `chocomania`, senha de desenvolvimento `chocomania_local`.
- As portas ficam vinculadas ao loopback. O volume `postgres_data` preserva contas, catálogo e carrinhos.
- Não são criadas contas de demonstração ou administrador.

Copie `.env.example` da raiz para `.env` para mudar portas, banco, senha e origens CORS. Use `COOKIE_SECURE=true` com HTTPS.
O padrão de desenvolvimento permite as origens `http://localhost:5173` e `http://127.0.0.1:5173`, com credenciais.

Com Java 21 e Maven instalados, também é possível iniciar apenas o banco e executar a API localmente:

```sh
docker compose up -d db
cd backend
mvn spring-boot:run
```

Nesse modo, use as variáveis `DATABASE_URL`, `POSTGRES_USER` e `POSTGRES_PASSWORD` no ambiente do processo se mudar os valores padrão. `DATABASE_URL` é uma URL JDBC.

## Rotas

Todas as rotas abaixo usam o prefixo `/api/v1`.

| Método | Rota | Entrada e resultado |
| --- | --- | --- |
| GET | `/csrf` | Retorna `{token, headerName}` e inicializa o cookie da sessão. |
| GET | `/categorias` | `{itens: [{id, nome, ordem}]}`. |
| GET | `/produtos` | Filtros `categoriaId`, `busca`, `pagina` (1), `tamanho` (20, máximo 100). Retorna `{itens, pagina, tamanho, total}`. |
| GET | `/produtos/{id}` | Detalhe com descrição, categoria, preço e estoque. |
| POST | `/usuarios` | `{nomeCompleto, email, senha, dataNascimento?}`. Cria conta e inicia sessão. |
| PUT | `/usuarios/me` | `{nomeCompleto, email}`. Atualiza somente a conta autenticada e retorna `{usuario: {id, nomeCompleto, email}}`. |
| DELETE | `/usuarios/me` | Sem corpo. Exclui a própria conta e seu carrinho, encerra a sessão e expira o cookie. Retorna `204`. |
| POST | `/sessao` | `{email, senha}`. Inicia sessão e retorna `{usuario: {id, nomeCompleto, email}}`. |
| GET | `/sessao` | Retorna o usuário atual ou `401`. |
| DELETE | `/sessao` | Encerra a sessão e expira o cookie. Retorna `204`. |
| GET | `/carrinho` | Retorna carrinho atual e cabeçalho `ETag`. Cria carrinho vazio para visitante novo. |
| POST | `/carrinho/itens` | `{produtoId, quantidade}`. Soma quantidade. Aceita `Idempotency-Key` opcional. |
| PATCH | `/carrinho/itens/{produtoId}` | `{quantidade}`. Substitui quantidade. Exige `If-Match`. |
| DELETE | `/carrinho/itens/{produtoId}` | Remove item. Exige `If-Match`. |
| POST | `/pedidos` | Sem corpo. Salva o pedido e esvazia o carrinho. Exige login, CSRF e `If-Match`. Retorna `201`, `{id, totalCentavos, carrinho}` e o ETag do carrinho vazio. Sem login retorna `401`. |

Campos extras no JSON são rejeitados. A senha exige entre 8 caracteres e 72 bytes UTF-8. O nascimento é opcional e deve indicar uma data anterior à atual.
E-mails são normalizados para minúsculas e únicos. Senhas ficam armazenadas com BCrypt e nunca aparecem nas respostas.

A atualização de perfil exige os dois campos, usa o identificador da sessão e preserva senha, nascimento e carrinho. Não recebe identificador de usuário. Sem sessão retorna `401`; e-mail já usado por outra conta retorna `409`; campos inválidos retornam `422`. Depois de trocar o e-mail, use o novo endereço no próximo login.

A exclusão de conta exige sessão e token CSRF, usa somente o identificador da sessão e remove permanentemente o usuário, seu carrinho, itens e operações do carrinho em uma transação. Sem sessão válida retorna `401`; sem CSRF válido retorna `403`. O e-mail pode ser cadastrado novamente; a conta recriada recebe outro identificador e não recupera o carrinho excluído. No frontend, o link “Excluir minha conta” em Minha conta abre uma tela com confirmação e cancelamento.

## Sessão e CSRF

Antes de um POST, PUT, PATCH ou DELETE, consulte `/csrf`, mantenha o cookie e envie o token no cabeçalho indicado (`X-CSRF-TOKEN`).
No navegador, use `credentials: 'include'` em todas as requisições de sessão e carrinho.

Exemplo no console do navegador, em uma origem permitida:

```js
const base = 'http://localhost:8080/api/v1';
const csrf = await fetch(`${base}/csrf`, { credentials: 'include' }).then(r => r.json());
const resposta = await fetch(`${base}/usuarios`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
  body: JSON.stringify({
    nomeCompleto: 'Ana Silva',
    email: 'ana@example.com',
    senha: 'Senha@123',
  }),
});
console.log(resposta.status, await resposta.json());
```

O cookie de sessão é HttpOnly e expira após 30 minutos de inatividade. Após logout ou reinício da API, obtenha novo token CSRF.
As sessões ficam na memória da API; contas e carrinhos autenticados ficam no PostgreSQL. Após reiniciar a API, faça login para recuperar o carrinho da conta.
Carrinhos de visitantes perdem o vínculo quando a sessão expira ou a API reinicia.

O carrinho visitante é transferido à conta na primeira consulta ou mutação autenticada, somente se a conta ainda não tiver carrinho.
Se a conta já tiver carrinho, ele prevalece; os itens do visitante não são combinados.
Após logout, o visitante recebe outro carrinho vazio. O carrinho privado continua associado à conta.

## Valores e concorrência

Preços e totais usam centavos inteiros em BRL. O desconto é arredondado por unidade para o centavo mais próximo antes de multiplicar pela quantidade.
O servidor calcula preços e verifica estoque. Adicionar ao carrinho não reserva ou reduz o estoque.

Toda resposta do carrinho inclui `ETag`, como `"2"`. Envie esse valor completo em `If-Match` ao ajustar, remover ou realizar um pedido.
Ausência de `If-Match` retorna `428`; versão antiga retorna `412`. Consulte o carrinho novamente antes de repetir.
`Idempotency-Key` evita somar duas vezes o mesmo acréscimo no mesmo carrinho. Use uma chave nova por intenção.
Repetição com outro produto ou quantidade retorna `409`; repetição igual retorna o estado atual, sem novo acréscimo.

Erros usam `{codigo, mensagem, campos?}`. JSON inválido retorna `400`, validação de campos `422`, e-mail repetido ou estoque insuficiente `409`.
CSRF ausente ou inválido retorna `403`. Login inválido retorna mensagem uniforme com `401`.

## Verificar

```sh
cd backend
mvn verify
```

Com os containers ativos, execute da raiz em PowerShell 7:

```powershell
pwsh -File backend/scripts/smoke.ps1
```

Para verificar as mesmas operações passando pelo proxy do frontend:

```powershell
pwsh -File backend/scripts/smoke.ps1 -BaseUrl http://127.0.0.1:5173 -HealthBaseUrl http://127.0.0.1:8080
```

Nesse caso, somente a consulta de saúde usa a porta da API. Catálogo, sessão, CSRF e carrinho passam pelo frontend.

O teste HTTP usa PostgreSQL real e cria contas de teste com e-mail único. Ele não limpa os registros automaticamente.

## Escopo

Esta entrega cobre catálogo, cadastro básico, edição de nome/e-mail, sessão, carrinho e registro de pedidos. O frontend Angular em `frontend/` consome a API por meio do proxy de desenvolvimento ou do reverse proxy de produção.
A especificação de migração também propõe telefone/endereço obrigatórios, recuperação de senha e limites de frequência. Esses recursos não fazem parte desta versão básica.
Pedidos ficam nas tabelas `pedidos` e `itens_pedido`, com data, usuário autenticado, títulos, quantidades, preços e total em centavos. O usuário é obtido somente da sessão; visitantes recebem `401` e mantêm seu carrinho. A gravação e a limpeza do carrinho ocorrem na mesma transação; falhas preservam o carrinho. Carrinho vazio ou itens indisponíveis/com estoque insuficiente retornam `409`. Versão antiga retorna `412`, evitando duplicação por cliques simultâneos.

Não há pagamento, baixa de estoque, envio de e-mails ou administração de estoque.

# Especificação de migração do frontend Chocomania

## 1. Visão geral do sistema

**EXISTENTE** — Chocomania é uma SPA em português do Brasil para navegar em um catálogo de chocolates, buscar pelo título, consultar um produto, montar um carrinho e simular cadastro, autenticação e saída. O React usa um catálogo estático e armazenamento local. O carrinho pode ser usado antes ou depois do login. O botão «Prosseguir» é exibido sem ação. O código não contém checkout, pedido, pagamento, cálculo de frete, estoque compartilhado, gestão administrativa, recuperação de senha ou API HTTP.

Esta especificação usa **EXISTENTE** para comportamento confirmado, **NOVO REQUISITO** para o escopo solicitado para Angular, **MELHORIA** para evolução recomendada e **PENDENTE** para decisões de negócio ou arquitetura ainda abertas. O diagnóstico do React se baseia na leitura do código reorganizado em `frontend/`. Os exemplos de API são propostas para implementação futura.

## 2. Stack tecnológica atual

| Dependência ou ferramenta | Versão declarada | Versão do lockfile | Uso |
| --- | --- | --- | --- |
| React e React DOM | ^19.2.8 | 19.3.0 | Componentes, hooks e montagem no DOM |
| React Router DOM | ^7.18.4 | 7.18.4 | Histórico do navegador, parâmetros, query string e redirecionamentos |
| TypeScript | ~6.0.2 | 6.0.3 | Tipos e checagem via `tsc -b` |
| Vite | ^8.3.0 | 8.3.1 | Servidor de desenvolvimento e build |
| @vitejs/plugin-react | ^6.1.1 | 6.1.1 | Suporte React e atualização em desenvolvimento |
| Tailwind CSS e @tailwindcss/vite | ^4.3.3 | 4.3.3 | Utilitários no JSX e integração ao build |
| Lucide React | ^1.48.0 | 1.48.0 | Ícone Trash2 para remover item |
| ESLint e typescript-eslint | ^10.10.0 / ^8.69.0 | 10.11.0 / 8.70.1 | Regras JS/TS, hooks e React Refresh |

Fontes de versões e comandos em `frontend/package.json` e `frontend/package-lock.json`. `frontend/vite.config.ts` habilita os plugins React e Tailwind. `frontend/tsconfig.app.json` usa alvo ES2023, tipos DOM e resolução de bundler. `frontend/eslint.config.js` ignora `dist/`. A partir de `frontend/`, os scripts disponíveis são `npm run dev`, `npm run build`, `npm run lint` e `npm run preview`; `npm ci` instala pelo lockfile. O projeto não declara script de testes.

## 3. Arquitetura e organização

| Caminho no repositório | Responsabilidade |
| --- | --- |
| `frontend/index.html`, `frontend/src/main.tsx` | HTML pt-BR, viewport responsiva e montagem de `App` em `#root` dentro de `StrictMode` |
| `frontend/src/App.tsx`, `frontend/src/App.css` | Shell da SPA, cabeçalho, busca, navegação, conteúdo por rota, rodapé e estilos correspondentes |
| `frontend/src/index.css` | Importa Tailwind, aplica fundo global e organiza o shell em coluna |
| `frontend/src/components/pages/` | Sete componentes de rota em subdiretórios, com CSS por tela. `Logado` reaproveita `Login.css` |
| `frontend/src/components/Carrossel/CarrosselProdutos.tsx` | Faixa de itens por categoria, controle da rolagem e cartões clicáveis |
| `frontend/src/components/ProdutosCarrinho/ProdutosCarrinho.tsx` | Exibe item, quantidade, preço e ações via callbacks recebidos do carrinho |
| `frontend/src/models/` | Catálogo estático, contas simuladas, funções de leitura e gravação de usuários e tipos de carrinho |
| `frontend/public/` | Arquivos estáticos servidos pelo Vite a partir da raiz pública |
| `backend/` | Diretório reservado para a futura implementação |

**EXISTENTE** — `useState` guarda busca, campos, marcação de erro e quantidades. `useRef` guarda o elemento rolável do carrossel. A URL carrega o ID de produto ou o termo da busca. As páginas importam o catálogo diretamente; `Login`, `Cadastro` e `Logado` compartilham `obterUsuarios` e `salvarUsuarios`. As páginas de produto e carrinho leem e gravam diretamente em `localStorage`. Não há store, contexto de autenticação, formulário de terceiros ou cliente de API.

## 4. Mapa de páginas e rotas

O `BrowserRouter` em `frontend/src/App.tsx` mantém cabeçalho e rodapé em todas as rotas. O menu usa links de SPA; a marca usa um `href="/"` nativo, que recarrega o documento. Não existe rota coringa de 404 para URLs sem correspondência. Em hospedagem, URLs profundas precisam de fallback para o HTML da SPA.

| Rota | Componente em `frontend/src/components/pages/` | Acesso e navegação |
| --- | --- | --- |
| `/` | `Vitrine/Vitrine.tsx` | Pública. Entrada pelo menu, marca, retorno do carrinho vazio e sucesso de login/cadastro |
| `/produto/:id` | `Produto/Produto.tsx` | Pública. Cartões da vitrine e busca apontam para esta rota. O componente converte o parâmetro com `Number` e também aceita uma prop numérica opcional com precedência |
| `/resultado-busca?busca=<termo>` | `ResultadoBusca/ResultadoBusca.tsx` | Pública. Aberta pela busca no cabeçalho, inclusive durante digitação. A rota aceita query ausente ou vazia |
| `/carrinho` | `Carrinho/Carrinho.tsx` | Pública. Acesso pelo menu. A presença de itens não depende da sessão |
| `/login` | `Login/Login.tsx` | Usuário com marca local de sessão vai para `/logado` com substituição do histórico |
| `/cadastro` | `Cadastro/Cadastro.tsx` | Mesmo redirecionamento de `/login` quando há sessão local |
| `/logado` | `Logado/Logado.tsx` | Sem sessão local, redireciona para `/login` com substituição do histórico. Usuário com sessão pode chegar diretamente ou ao abrir login/cadastro |

## 5. Requisitos funcionais

As interações abaixo são **EXISTENTE**. As leituras e gravações são síncronas. O React não apresenta estados de requisição nem tratamento de indisponibilidade de serviço.

| Funcionalidade e evidência | Interação, regras e estados |
| --- | --- |
| Navegação global — `frontend/src/App.tsx` | Início, Carrinho, Login e Cadastro aparecem inclusive para usuário logado. A marca retorna ao início. Rodapé exibe marca, horário, telefone, endereço e link `mailto:`; este aciona o cliente de e-mail. Nenhum contato é consultado por API. |
| Vitrine — `frontend/src/components/pages/Vitrine/Vitrine.tsx`, `frontend/src/components/Carrossel/CarrosselProdutos.tsx` | Exibe quatro carrosséis em ordem fixa: Chocolates em Barra, Bombons, Trufas, Bebidas e Cremes de Chocolate. Filtra cada faixa por igualdade da categoria e mantém a ordem do array. Sem ordenação por popularidade. Em desktop, cada seta desloca a faixa em ±320 px com animação; no mobile usa rolagem horizontal nativa. Imagem, título e preço compõem um link único ao detalhe. Categoria sem produtos teria uma faixa sem cartões, sem mensagem específica. |
| Pesquisa — `frontend/src/App.tsx`, `frontend/src/components/pages/ResultadoBusca/ResultadoBusca.tsx` | Cada mudança e o submit navegam para a query codificada após `trim`; uma entrada vazia retorna a `/`. O campo pertence ao cabeçalho e seu valor não é inicializado a partir da URL. Resultado filtra somente o título por substring após converter para minúsculas, sem remover acentos e mantendo a ordem original. Acesso direto à rota sem termo mostra todos. O título mostra «Resultados para: …» e a busca sem correspondências mostra «Nenhum produto encontrado.». |
| Detalhe — `frontend/src/components/pages/Produto/Produto.tsx` | Exibe imagem, título, descrição, categoria e preço. ID sem correspondência mostra «Produto não encontrado.». Quantidade inicial 1. O botão − aplica piso 1 e + aplica teto igual a `produto.quantidade`. O estoque limita os controles, mas a tela mostra a categoria, sem número de unidades disponíveis. Não há estado específico para produto sem estoque. |
| Adicionar ao carrinho — `frontend/src/components/pages/Produto/Produto.tsx` | Encontra item por ID e soma a quantidade escolhida, limitando o acumulado ao estoque; para item novo, copia o produto e grava `qtd`. O fallback na soma é `qtd ?? quantidade ?? 0`. Mostra alerta de sucesso inclusive se o limite já foi atingido e permanece no detalhe. Sem reserva ou decremento do estoque do catálogo. |
| Consultar, atualizar e excluir item — `frontend/src/components/pages/Carrinho/Carrinho.tsx`, `frontend/src/components/ProdutosCarrinho/ProdutosCarrinho.tsx` | Lê lista local no mount. Normaliza `qtd ?? quantidade ?? 1`; `quantidade` também é o campo de estoque na estrutura atual. Ações ± limitam a quantidade a `max(1,min(valor,estoque))`, e a lixeira remove imediatamente sem confirmação. Mudanças atualizam estado e armazenamento. Item ausente no ajuste é ignorado. Ao remover o último item, exibe «Carrinho vazio» e link «Ir as compras». |
| Preços e resumo — componentes da vitrine, busca, detalhe e carrinho | Valor final unitário = `preco * (100 - desconto) / 100`. Quando há desconto, preço original riscado e preço final em vermelho. No carrinho, subtotal = soma de preço-base × quantidade; total = soma de preço final × quantidade; descontos = diferença entre subtotal e total. A apresentação usa `R$ ` e `toFixed(2)`; a aritmética soma valores em ponto flutuante antes da exibição. «Prosseguir» é um botão sem handler ou rota. |
| Cadastro local — `frontend/src/components/pages/Cadastro/Cadastro.tsx`, `frontend/src/models/Usuarios.ts` | Nome, e-mail, senha e data de nascimento. Valida nome não vazio após trim, e-mail por regex e unicidade local ignorando caixa, senha não vazia e data não vazia. A edição limpa a marca de erro do campo. Alertas «Email já cadastrado» ou «Preencha todos os campos corretamente». Sucesso cria ID `max + 1`, marca conta como logada, desmarca as demais, persiste o registro e a sessão, exibe alerta e retorna ao início. |
| Login local — `frontend/src/components/pages/Login/Login.tsx`, `frontend/src/models/Usuarios.ts` | E-mail e senha controlados; compara e-mail após trim e minúsculas e valida o campo bruto por regex. A senha é comparada literalmente. Erro marca campos, define `aria-invalid` e mostra «Email inválido ou não cadastrado» ou «Senha incorreta». Sucesso marca a conta ativa, desmarca as demais, persiste sessão, mostra «Login realizado com sucesso» e navega para o início. |
| Sessão e saída — `frontend/src/components/pages/Logado/Logado.tsx` | Boas-vindas com nome, «Você já está logado» e «Sair da conta». Sair desmarca a conta no array, regrava a cópia da sessão com `logado: false`, alerta «Você saiu da conta» e vai para login. Nenhum vínculo com os itens do carrinho. |

## 6. Requisitos não funcionais

| Dimensão | EXISTENTE | MELHORIA ou PENDENTE |
| --- | --- | --- |
| Responsividade | Viewport declarada, grades adaptáveis, rolagem localizada e pontos de quebra por tela | Aplicar diretrizes mobile-first da seção 10 e verificar o layout em viewport estreita e com zoom |
| Acessibilidade | Landmarks header/nav/main/footer, labels de campos, texto alternativo do catálogo, nomes acessíveis em setas, lixeira e busca, `aria-invalid` no login | Foco visível no campo de busca, rótulos e descrição de erro com `aria-describedby`, anúncios de resultado e carrinho, regiões de carrossel nomeadas e navegação por teclado mesmo sem setas, contraste e redução de movimento. Verificar ordem de títulos e foco após navegar |
| Usabilidade | Caminhos diretos, ações com texto ou nome acessível, vazio de busca/carrinho e produto indisponível por ID | Feedback em linha no lugar de alertas bloqueantes, indicação dos limites de estoque, sincronização campo/query, preservar foco e evitar histórico por caractere |
| Desempenho | Build estático e imagens de catálogo em WebP; filtro local de 40 registros | Banner ativo tem cerca de 2,29 MB. Imagens de produto não usam lazy loading no código. Medir custo inicial e diferir imagens fora da área visível sem substituir os originais. Agregar consultas por categoria e cancelar buscas obsoletas |
| Segurança | A simulação verifica a conta e a senha no próprio navegador | API valida credenciais, autorização e dados. Senhas locais e objetos de sessão manipuláveis não podem originar contas reais. Prever expiração de sessão, validação e proteção de dados. O `JSON.parse` atual não trata dado inválido |
| Manutenibilidade e reutilização | TypeScript, lint e componentes de carrossel/item já separados, CSS misto local/global | Centralizar fórmula de exibição de preços, apresentar cartão comum para vitrine e busca, compartilhar controles de quantidade, formulário e feedback. Isolar acesso a dados em serviços testáveis |
| Compatibilidade | O código usa CSS Grid/Flex, WebP, rolagem suave, `localStorage` e histórico HTML | **PENDENTE** — matriz de navegadores, versões mínimas e dispositivos. Testar Safari/iOS, Chrome/Android e desktop quando a matriz estiver definida. A análise estática não certifica compatibilidade |

## 7. Especificação da interface

| Elemento | Composição e medidas de referência |
| --- | --- |
| Shell — `frontend/src/App.css`, `frontend/src/index.css` | Fundo do corpo, área principal e carrosséis em marrom médio `#804828`. Cabeçalho e rodapé marrom escuro `#3b170f`. Dourado `#f4c96d` em cartões, botões, resumo e bordas; creme `#fff0bd` nos textos sobre fundo escuro; creme quente `#f6d5a4` no subtítulo e rodapé. Entradas `#fffdf9` com borda `#cda98a`. Estados de interação laranja `#c87932`. Erros de formulário `#b42318` sobre `#f9d6d0`; promoções em vermelho e original cinza riscado. |
| Tipografia | Marca, navegação, títulos de detalhe/carrinho/resultados e títulos de categoria usam Georgia ou cadeia serifada equivalente. Catálogo, carrinho, detalhe, busca e título dos formulários usam `Arial Rounded MT Bold`, `Trebuchet MS`, `sans-serif` conforme CSS. Marca em caixa alta, peso 700, espaçamento de letras 0,08 em e tamanho fluido de 2 a 3,35 rem. Slogan em itálico, 0,8 rem. Não há arquivo de fonte ou webfont importada. |
| Cabeçalho | Imagem `banner2.jpg` centralizada, `cover`, gradiente marrom por cima e brilho lateral em pseudoelemento. Área de marca + busca até 1180 px e altura mínima de 148 px no desktop; espaçamento horizontal de 4 rem. Busca em cápsula com borda de 3 px, largura até 620 px e botão dourado de 62 px com lupa. Faixa de navegação separada, centralizada, fundo marrom semitransparente e links espaçados em 3,5 rem no desktop. |
| Rodapé | Blocos de marca, atendimento e contato, seguidos por faixa de copyright com divisor discreto. Layout em grid `max-content` no desktop, espaçamento 2 rem, padding superior 3 rem. No mobile, marca ocupa a linha inteira e atendimento/contato ficam lado a lado. |
| Vitrine | Título serifado creme por categoria. Cada carrossel mede 28 rem de altura no desktop, com faixa horizontal sem barra visível. Cartões de cerca de 300 px de largura, dourados, arredondados e com imagem `cover` em 220 × 180 px, título centralizado e preço na base. Setas circulares de 56 px sobre as laterais a partir de `md`. |
| Busca | Container até 1200 px, com título e grid auto-fill de colunas a partir de 220 px, gap de 1 rem. Cartões dourados com altura mínima 360 px, imagem até 220 × 180 px, título centralizado e preço na base. Vazio como texto centralizado. |
| Detalhe | Até 1100 px de largura; duas colunas no desktop, separadas por 3 rem. Painel dourado da foto com mínimo de 420 px, imagem contida até 420 px. Título serifado fluido de 2 a 3 rem, descrição creme, preço em 2 rem e categoria em caixa alta. Grupo −/quantidade/+ com borda dourada e botão de adição dourado, de texto escuro, acompanhado de emoji decorativo. |
| Carrinho | Até 1100 px com coluna de itens e resumo de 320 px, gap de 2 rem. Cada linha dourada tem imagem contida de 110 × 110 px, área de título/preços, controles e lixeira. O resumo dourado apresenta subtotal, descontos e total em linhas alinhadas, divisor e botão marrom de largura total. |
| Login, cadastro e conta | Cartão central dourado até 460 px, borda de 7 px, raio 8 px e sombra. Padding desktop de 3 rem, título e subtítulo centralizados, formulário em coluna e rótulos acima de entradas claras. Botões escuros em caixa alta, foco laranja e erro em vermelho/rosa. A conta reaproveita o cartão de login e usa ação «Sair da conta» sublinhada. |
| Interações | Hover amplia cartões (1,05) e setas (1,10) com transições de 300 ms. Botões variam cor ou brilho. As notificações são `alert()` nativos de adição, login, cadastro e saída. Não há modal personalizado, toast ou indicador assíncrono. |

## 8. Inventário de assets

| Recurso preservado | Referência e uso |
| --- | --- |
| `frontend/public/banner2.jpg` | Fundo ativo do cabeçalho de todas as rotas em `frontend/src/App.css`, via `url('/banner2.jpg')` |
| `frontend/public/banner.jpg` | Imagem disponível sem referência de runtime encontrada |
| `frontend/public/ProdutoSemImagem.webp` | Placeholder disponível sem fallback implementado no React. Preservar nome e capitalização |
| `frontend/public/produtos-chocolate/produtos/*.webp` | 40 imagens referenciadas em `frontend/src/models/Produtos.ts` como `/produtos-chocolate/produtos/<arquivo>.webp`. A mesma referência segue para vitrine, busca, detalhe e snapshot do item de carrinho |
| `frontend/public/produtos-chocolate/mapa.csv` | Inventário auxiliar ID/título/arquivo/posição na grade/status/observação. Caminhos de arquivo são relativos ao diretório do CSV. O React não lê esse CSV |
| `frontend/public/produtos-chocolate/nao_usados/*.webp` | 12 imagens auxiliares preservadas sem referência no código |
| `frontend/public/produtos-chocolate.zip` | Arquivo auxiliar preservado sem consumo pelo runtime |
| `frontend/src/assets/` | Diretório presente localmente e vazio. Os antigos arquivos de template `hero.png`, `react.svg`, `vite.svg`, `public/favicon.svg` e `public/icons.svg` já estavam ausentes antes da reorganização. O HTML atual não referencia favicon |
| Ícones e logomarca no código | Lupa SVG inline em `frontend/src/App.tsx`, lixeira Lucide em `frontend/src/components/ProdutosCarrinho/ProdutosCarrinho.tsx`, setas Unicode no carrossel, emoji de sacola no detalhe. A marca «CHOCOMANIA» é texto com estilo, sem arquivo de logo. |

Grupos de imagens no catálogo original: IDs 1–10 barras, 11–20 bombons, 21–30 trufas e 31–40 bebidas e cremes. Exemplos de mapeamento são 1 → `chocolate-ao-leite.webp`, 11 → `bombom-de-morango.webp`, 21 → `trufa-tradicional.webp` e 31 → `chocolate-quente-cremoso.webp`. O `mapa.csv` preserva o mapeamento completo.

**NOVO REQUISITO** — Reutilizar os arquivos existentes. Se Angular for publicado sob subcaminho, resolver URLs de assets respeitando a base da aplicação ou o host de mídia configurado; caminhos começando por `/` apontam para a raiz do domínio. Preservar a correspondência catálogo–imagem por referência explícita em vez de gerar o nome pelo título. Validar os 40 arquivos e o banner no artefato publicado, em ambiente sensível a maiúsculas. O ZIP, CSV, imagens auxiliares e placeholder devem permanecer disponíveis no repositório mesmo se o build futuro publicar apenas os recursos de runtime.

## 9. Autenticação e cadastro

**EXISTENTE** — A autenticação é uma simulação persistida por origem do navegador. `usuarios` contém a lista completa com senhas em texto claro; `usuarioLogado` contém cópia da conta com senha e booleano `logado`. Quem controla esses dados controla a aparência de sessão. Não há cookie, expiração, servidor, verificação de e-mail ou perfis de autorização. A conta chamada «admin» no mock passa pelo mesmo fluxo que todas as demais. Data de nascimento atualmente é obrigatória e não tem uso fora do registro.

### Alterações para o cadastro

| Campo | Hoje | NOVO REQUISITO ou decisão proposta |
| --- | --- | --- |
| Nome completo | `nome`, com placeholder «Seu nome completo» | Reaproveitar campo e tornar rótulo explícito. Exigir texto após trim e aceitar Unicode, espaços, hífens e apóstrofos sem impor dois sobrenomes |
| E-mail | Obrigatório, formato simples e unicidade local ignorando caixa | Normalizar no cliente e no servidor com trim, validar formato e garantir unicidade no servidor pelo valor normalizado. Exibir duplicidade no campo quando retornada no cadastro |
| Telefone | Ausente | Adicionar `type="tel"` e autocomplete. Para o escopo brasileiro, aceitar número nacional com DDD (10 ou 11 dígitos) e prefixo opcional +55; enviar em formato internacional normalizado. Obrigatoriedade proposta para contato operacional, unicidade dispensável |
| Endereço | Ausente | Adicionar grupo de endereço com CEP, logradouro, número, complemento, bairro, cidade e UF. Validação proposta na seção de modelos. Um endereço inicial é suficiente para o escopo descrito; buscar CEP automaticamente e gerenciar vários endereços são decisões em aberto |
| CPF | Ausente | **PENDENTE** — incluir somente se houver finalidade fiscal ou operacional confirmada. Se aprovado, aceitar máscara visual, transmitir 11 dígitos, validar dígitos verificadores e rejeitar sequências repetidas. Unicidade depende do modelo de conta |
| Senha e confirmação | Senha obrigatória, sem confirmação | Manter senha e adicionar confirmação idêntica com `autocomplete="new-password"`. Exibir requisitos antes do envio; permitir colar e usar gerenciador. Validação cliente/servidor deve concordar. Política de comprimento fica **PENDENTE** |
| Data de nascimento | Obrigatória no React, sem consumo funcional | **PENDENTE** — finalidade, obrigatoriedade e eventual regra de idade. Proposta de DTO aceita data opcional até decisão; se coletada, validar data real não futura no servidor, sem introduzir idade mínima sem regra de negócio |

### Recuperação de senha

**NOVO REQUISITO** — Na tela de login, oferecer «Esqueci minha senha». Proposta de rotas Angular `/esqueci-minha-senha` e `/redefinir-senha?token=…`.

1. **Frontend** apresenta campo de e-mail, valida formato e impede envios duplicados enquanto aguarda. Após `202`, mostra a mesma mensagem para qualquer endereço válido, como «Se o e-mail estiver cadastrado, você receberá instruções». Falhas de rede ou limite de tentativas permitem nova tentativa conforme resposta.
2. **Backend** normaliza o e-mail, limita solicitações por conta e origem e responde de forma uniforme. Para conta elegível, gera token aleatório e de uso único, guarda somente seu digest e metadados de validade, e envia link HTTPS para a rota Angular. O serviço de e-mail e o prazo de expiração ficam **PENDENTE**.
3. **Frontend** extrai o token do link sem persistir em storage ou enviar para telemetria. Consulta a validação para decidir entre mostrar o formulário ou oferecer novo pedido. Recebe nova senha e confirmação, exibe requisitos e trata token ausente, inválido, expirado ou consumido. Evita recursos de terceiros na tela e mantém o token fora de logs e do referenciador.
4. **Backend** revalida token, expiração e política de senha no envio final. Altera a credencial, consome o token atomicamente e invalida sessões anteriores conforme política proposta. **Frontend** limpa o estado sensível, mostra sucesso e oferece retorno ao login. O fluxo de recuperação não autentica automaticamente.

## 10. Responsividade

| Área | EXISTENTE | NOVO REQUISITO e MELHORIA |
| --- | --- | --- |
| Cabeçalho e menu | Até 700 px, marca e busca em coluna com altura mínima de 206 px, campo até 48 px de altura e menu quebra linhas. Rodapé usa duas colunas após a marca | Começar com busca e navegação disponíveis em tela estreita. Usar wraps e controle de menu acessível se necessário, sem esconder atalhos essenciais. Testar quebra do e-mail no rodapé, com endereço e texto longos |
| Carrossel | Até 600 px, 19 rem de altura, cartões de 16 rem e largura `(100vw - 2.5rem) / 2`, imagem com 105 px de altura. As setas são ocultadas abaixo de `md`; trilho sem barra visível | Preservar gesto horizontal no trilho e oferecer acesso equivalente por teclado, indicação de itens adicionais e foco visível. Limitar o overflow ao trilho; permitir que preços e títulos quebrem sem corte |
| Resultados | Até 600 px, duas colunas, cartões com mínimo de 245 px, fontes reduzidas e preços promocionais sem quebra | Usar uma coluna quando duas não comportarem preço e título, adotando duas ou mais quando houver espaço. Tratar quebra de preços promocionais, imagens de altura previsível e títulos extensos |
| Detalhe | Até 700 px, uma coluna, foto com mínimo de 280 px de altura e botão flexível com mínimo de 3,2 rem | Permitir quebra de preço e ações em linha separada; controles com tamanho e estado indisponível explícitos. Proteger também a faixa logo acima de 700 px onde as duas colunas exigem largura mínima |
| Carrinho | Até 800 px, resumo abaixo dos itens; até 600 px, imagem de 76 px e ações em uma segunda linha. Não há tabela no React | Preservar cartões empilháveis, permitir quebra nos preços, manter total e ação legíveis e aumentar alvos de quantidade e lixeira para cerca de 44 px. Manter o resumo no fluxo para não cobrir itens ou mensagens |
| Formulários | Até 520 px, padding externo `2.5rem 1rem` e cartão `2rem 1.25rem`. Cadastro atual tem quatro campos | Usar uma coluna no celular e duas apenas em pares com espaço suficiente, como número/complemento. Associar erros às entradas, aproveitar teclados de e-mail/telefone/CEP e evitar rolagem horizontal com mensagens longas |

Validar 320, 375, 390, 768 e 1280 px, com zoom de 200%, navegação por teclado, toque e orientação horizontal. São critérios propostos. A inspeção de CSS identifica riscos de overflow e legibilidade, sem medição de layout em navegador durante esta análise.

## 11. Dados mockados e integrações

| Fonte atual | Consumidores | Leitura e escrita atuais | Substituição futura |
| --- | --- | --- | --- |
| `frontend/src/models/Produtos.ts` | Vitrine via carrossel, busca, detalhe e carrinho por cópia | 40 objetos, quatro categorias, IDs 1–40. Leitura síncrona e filtro local. `popularidade` está presente e não é consumida. Nenhuma escrita no catálogo | Consultar catálogo, categorias e detalhe por API. Manter mapeamento de mídia. Popularidade só integra DTO se surgir requisito para consumi-la |
| Categorias em `frontend/src/components/pages/Vitrine/Vitrine.tsx` | Carrosséis | Quatro rótulos e ordem fixos | Consultar categorias com ordem de exibição; preservar sequência na configuração inicial real |
| `frontend/src/models/Usuarios.ts` | Login, cadastro e conta | Seis contas de demonstração como fallback; após escrita, lê JSON de `usuarios`. Inclui nome, e-mail, senha, data e flag. Sem escrita remota | Registro, sessão e recuperação geridos pela API. As contas de demonstração e seus segredos não são fonte para produção |
| `usuarioLogado` em `localStorage` | Login, cadastro, conta | Cópia de usuário, alterada por cadastro/login/saída; decide redirecionamento | Estado derivado de consulta de sessão. Não persistir cópia da credencial |
| `carrinho` em `localStorage` | Detalhe e carrinho | Array com snapshot do produto + `qtd`, leitura, adição cumulativa, ajuste e remoção. O tipo `Carrinho` com `itens` existe mas não é o formato gravado | API de carrinho para visitante e sessão autenticada, com preço e estoque avaliados no servidor. Política de importação de carrinho antigo fica pendente |
| Texto e contato de rodapé em `frontend/src/App.tsx` | Todas as rotas | Copy estático, horário, telefone com zeros, endereço e `mailto:` | Validar dados comerciais com o responsável. Podem permanecer como configuração de conteúdo; nenhuma API dedicada é necessária pelo escopo atual |

**EXISTENTE** — A integração `mailto:` é um link de navegação para o cliente de e-mail. Assets são arquivos HTTP estáticos. O React não define endpoints de catálogo, carrinho ou autenticação. Os únicos contratos de dados em uso são as interfaces e chaves do navegador acima.

## 12. Modelos de dados e contratos de API

### 12.1. Contratos de dados existentes no React

| Contrato | Forma exata | Identidade e consumo |
| --- | --- | --- |
| `Produto` em `frontend/src/models/Produtos.ts` | `id`, `preco`, `desconto`, `quantidade` são números; `titulo`, `descricao`, `categoria`, `imagem` são strings; `popularidade` é booleano. Todos obrigatórios | ID numérico identifica rota e linha do carrinho. `desconto` é percentual e `quantidade` é estoque. Categoria é rótulo, imagem é caminho público |
| `ItemsCarrinho` e `Carrinho` em `frontend/src/models/` | `ItemsCarrinho extends Produto` com `qtd: number`. `Carrinho` declara `itens: ItemsCarrinho[]`. O storage `carrinho` grava `ItemsCarrinho[]` diretamente | Um snapshot por produto. Leitura aceita ausência histórica de `qtd`, com fallbacks diferentes no detalhe e no carrinho |
| `Usuarios` em `frontend/src/models/Usuarios.ts` | `id: number`, `nome: string`, `email: string`, `senha: string`, `dataNascimento: string`, `logado: boolean`. Todos obrigatórios | E-mail é consultado sem distinção de caixa. `usuarios` grava array, `usuarioLogado` grava objeto completo. `dataNascimento` vem de input date |

### 12.2. Domínio futuro proposto

**NOVO REQUISITO** — Entidades abaixo estabelecem a fronteira lógica entre backend e Angular. Identificadores de produto e categoria são inteiros positivos para preservar a rota existente; IDs de conta e carrinho podem ser strings opacas geradas pelo servidor. Todos os campos são obrigatórios salvo indicação. Tipos e validações se aplicam na fronteira de API e nas entidades conforme indicado.

| Entidade e finalidade | Campos, tipos e validações | Identidade, relação e uso |
| --- | --- | --- |
| Categoria — agrupar o catálogo | `id: integer > 0`, `nome: string` não vazio, `ordem: integer >= 0`. Em empates, ordenar por ID | ID único. Categoria tem zero ou mais produtos. Vitrine exibe rótulo e ordem. Nome não é chave |
| Produto — item navegável | `id: integer > 0`, `categoriaId: integer > 0`, `titulo: string` e `descricao: string` não vazios, `imagemUrl: string` caminho público ou HTTPS de mídia aprovada, `precoBaseCentavos: integer >= 0`, `descontoPercentual: integer 0..100`, `estoqueDisponivel: integer >= 0` | ID único. Pertence a categoria existente; pode constar em vários carrinhos. Título não precisa ser único. Vitrine, busca, detalhe e carrinho. Campo popularidade fica fora do contrato inicial por falta de consumidor |
| Carrinho — seleção atual de visitante ou conta | `id: string`, `usuarioId?: string`, lista de itens, `versao: integer >= 1`. Projeção de resposta inclui totais e moeda `BRL`. Visitante identificado por sessão opaca no servidor | ID único, acesso limitado ao titular da sessão. Relação 0..1 com usuário por carrinho; carrinho tem 0..N itens. Produto, carrinho e sessão |
| ItemCarrinho — produto selecionado | `produtoId: integer > 0`, `quantidade: integer >= 1`; disponibilidade e preços vêm do catálogo, projeção inclui valores unitário/linha e situação `DISPONIVEL`, `ESTOQUE_INSUFICIENTE` ou `INDISPONIVEL` | Chave única `(carrinhoId, produtoId)`. Operações validam estoque; queda posterior de estoque pode deixar item visível em conflito. Detalhe e página de carrinho |
| Usuário — conta e contato | `id: string`, `nomeCompleto: string`, `email: string` normalizado, `telefone: string` no formato internacional proposto, `endereco: Endereco` obrigatório no cadastro proposto. `dataNascimento?: string` de data ISO civil, `cpf?: string` condicional conforme seção 9 | ID e e-mail normalizado únicos. Contato e endereço de cadastro; conta consome projeção mínima. CPF condicionado a decisão de negócio |
| Endereço — endereço inicial da conta | `cep: string` com 8 dígitos, `logradouro: string`, `numero: string` não vazio, `complemento?: string`, `bairro: string`, `cidade: string`, `uf: string` de duas letras entre as UFs brasileiras. Campos textuais obrigatórios após trim. **PENDENTE** — limite de caracteres e aceitação de «s/n» | Objeto vinculado à conta, sem identificador público no cadastro inicial. O mesmo endereço pode pertencer a contas diferentes. Formulário de cadastro |
| Credencial e sessão — acesso autenticado | Credencial interna com `usuarioId: string` e `senhaHash: string`; sessão interna com identificador opaco, `usuarioId: string`, `expiraEm: string` em ISO UTC e `revogadaEm?: string`. Segredo e digest internos | Uma credencial por conta. Usuário pode ter sessões distintas; política de concorrência **PENDENTE**. Login, bootstrap de sessão, guard, logout |
| Recuperação de senha — autorização temporária | `usuarioId: string`, `tokenDigest: string`, `expiraEm: string` em ISO UTC e `consumidoEm?: string`. Digest único, expiração verificada pelo relógio do servidor, consumo único | Usuário pode ter registros históricos de recuperação. **PENDENTE** — invalidar solicitações anteriores ao gerar um novo token. Formulários de solicitação e redefinição |

Dinheiro no contrato proposto usa centavos inteiros. Calcular preço final arredondando por unidade para o centavo e derivar desconto e total de linha dessa unidade. Essa é uma proposta, pois o React atual arredonda na apresentação e pode divergir por centavos em certos carrinhos. **PENDENTE** — validar regra comercial de arredondamento, moeda, reprecificação e tratamento de promoções. Para todos os objetos, o servidor controla IDs, versões, preços, autorizações e campos internos.

### 12.3. DTOs HTTP e modelos de interface

| Tipo | Campos e responsabilidade |
| --- | --- |
| `CategoriaDto` | `{id, nome, ordem}`. Permite associar categoria de vitrine e rótulo |
| `ProdutoResumoDto` | `{id, categoriaId, titulo, imagemUrl, precoBaseCentavos, descontoPercentual, precoFinalCentavos, estoqueDisponivel}`. Catálogo e cartões |
| `ProdutoDetalheDto` | Campos do resumo + `descricao` e `categoria: CategoriaDto`. Detalhe |
| `PaginaDto<T>` | `{itens: T[], pagina: integer, tamanho: integer, total: integer}`; resultado vazio com `itens: []` e `total: 0` quando não há correspondência |
| `CarrinhoDto` | `{id, versao, moeda, itens, subtotalCentavos, descontoCentavos, totalCentavos}`. Item com `produtoId, titulo, imagemUrl, quantidade, estoqueDisponivel, precoBaseCentavos, precoFinalCentavos, totalCentavos, situacao`. Se o produto for retirado do catálogo, conservar título/imagem para permitir identificação e remoção; preço e total do item indisponível não entram no total do carrinho |
| `AdicionarItemRequest` / `AtualizarItemRequest` | `{produtoId, quantidade}` para acréscimo; `{quantidade}` para valor absoluto no item identificado na rota. Valores monetários, versão e dono não vêm no JSON |
| `CadastroRequest` | `{nomeCompleto, email, telefone, endereco, senha, dataNascimento?}`; `cpf` somente se aprovado. A confirmação é um controle de formulário e fica no cliente |
| `LoginRequest` / `SessaoDto` | `{email, senha}` entra; `{usuario: {id, nomeCompleto, email}}` sai. O cookie de sessão é emitido separadamente |
| DTOs de recuperação | `{email}` para solicitar, `{token}` para verificar e `{token, novaSenha}` para concluir. A confirmação fica no cliente |
| `ErroDto` | `{codigo: string, mensagem: string, campos?: Record<string,string>, traceId?: string}`. Usar caminhos de campo como `endereco.cep`. Para `ESTOQUE_INSUFICIENTE`, estender com `detalhes: {produtoId: integer, estoqueDisponivel: integer}`. Renderizar mensagem como texto, sem HTML |
| Modelos de interface | `CartaoProdutoVm` com título, link, imagem e rótulos formatados em pt-BR; `DetalheProdutoVm` adiciona quantidade selecionada e disponibilidade; `CarrinhoVm` guarda carrinho confirmado, estado por ação e totais formatados; formulários tipados armazenam máscaras e confirmações. Estados `inicial`, `carregando`, `sucesso`, `vazio` e `erro` pertencem à UI |

### 12.4. Catálogo dos endpoints propostos

Prefixo sugerido `/api/v1`. Para todos os endpoints abaixo, JSON malformado ou parâmetro impossível retorna `400`; campos semanticamente inválidos retornam `422` com erros de campo. Falhas inesperadas retornam `500` ou `503`, sem detalhes internos. Aplicar HTTPS em produção. Nenhuma rota da tabela existe no React.

| Operação / tela | Método e rota relativa ao prefixo | Parâmetros e entrada | Sucesso e erros específicos | Acesso |
| --- | --- | --- | --- | --- |
| Categorias da vitrine | `GET /categorias` | Sem parâmetros; ordem por `ordem,id` | `200` `{itens: CategoriaDto[]}`, lista vazia permitida | Público |
| Listagem da vitrine e busca | `GET /produtos` | `categoriaId?`, `busca?` (trim, substring do título sem distinguir caixa, diacríticos preservados), `pagina?` padrão 1, `tamanho?` padrão 20, faixa 1–100; ordem estável por ID. Filtros combinam com AND. Campo de ordenação adicional fica pendente | `200` `PaginaDto<ProdutoResumoDto>`; categoria sem correspondência retorna vazio; query inválida `400` | Público |
| Detalhe de produto | `GET /produtos/{produtoId}` | ID inteiro positivo na rota | `200` `ProdutoDetalheDto`; `404 PRODUTO_NAO_ENCONTRADO` | Público |
| Consultar carrinho atual | `GET /carrinho` | Sem parâmetros. Sem carrinho anterior, inicializa a sessão de visitante e retorna representação vazia; não cria itens | `200` `CarrinhoDto` + ETag. Cookie opaco identifica visitante ou sessão autenticada | Titular do contexto |
| Adicionar ao carrinho | `POST /carrinho/itens` | `AdicionarItemRequest`, com `Idempotency-Key` por intenção do usuário para evitar acréscimo duplicado em retry | `201` para nova linha, `200` quando já existe, ambos `CarrinhoDto` + ETag. `404` produto ausente; `409 ESTOQUE_INSUFICIENTE` ou reutilização da chave com outro payload | Titular do contexto |
| Ajustar quantidade | `PATCH /carrinho/itens/{produtoId}` | `AtualizarItemRequest` e `If-Match` com ETag da leitura anterior | `200` `CarrinhoDto` + ETag; `404` item ausente, `409` estoque, `412` versão divergente, `428` sem precondição | Titular do contexto |
| Remover item | `DELETE /carrinho/itens/{produtoId}` | ID na rota, `If-Match`; sem body | `200` `CarrinhoDto` + ETag. Com versão atual e item ausente, retorna carrinho atual. `412`/ `428` para precondição | Titular do contexto |
| Cadastro | `POST /usuarios` | `CadastroRequest` | `201` `SessaoDto` + cookie, preservando cadastro com login imediato; `409 EMAIL_JA_CADASTRADO`, `422`, `429` | Público, limitado por frequência |
| Login | `POST /sessao` | `LoginRequest` | `200` `SessaoDto` + cookie; `401 CREDENCIAIS_INVALIDAS` uniforme; `429` | Público, limitado por frequência |
| Restaurar sessão / conta | `GET /sessao` | Cookie de sessão | `200` `SessaoDto`; `401 SESSAO_INVALIDA` para ausência, expiração ou revogação | Usuário autenticado |
| Sair | `DELETE /sessao` | Cookie; sem body | `204`, revoga sessão e expira cookie. Repetição sem sessão também retorna `204` | Sessão própria |
| Solicitar recuperação | `POST /recuperacoes-de-senha` | `{email}` | `202` sem body com resposta uniforme; `422` formato inválido, `429` limite | Público, limitado por frequência |
| Validar token de recuperação | `POST /recuperacoes-de-senha/validacoes` | `{token}` no body; não consome token | `204` utilizável; `400 TOKEN_INVALIDO_OU_EXPIRADO` para token inválido/expirado/consumido; `429` | Público, token no corpo e limite por frequência |
| Redefinir senha | `POST /recuperacoes-de-senha/confirmacoes` | `{token, novaSenha}` | `204` alteração concluída; `400 TOKEN_INVALIDO_OU_EXPIRADO`, `422` política de senha, `429` | Público, posse do token válido |

Para mutações no carrinho, respeitar o estoque com validação atômica. Na soma que excede o estoque, a proposta retorna `409` e informa a disponibilidade, substituindo o truncamento silencioso atual por uma interação explícita. Em tela, ao chegar no limite, desabilitar incremento e informar o limite. A manutenção dos recursos deve admitir requisições repetidas e mudanças concorrentes.

### 12.5. Exemplos JSON

Os valores a seguir ilustram o formato, sem criar fixtures de produção. Respostas `204` e o `202` de recuperação não têm corpo.

`GET /api/v1/categorias` — resposta.

```json
{
  "itens": [
    {"id": 1, "nome": "Chocolates em Barra", "ordem": 1}
  ]
}
```

`GET /api/v1/produtos?categoriaId=1&busca=chocolate&pagina=1&tamanho=20` — resposta.

```json
{
  "itens": [
    {
      "id": 2,
      "categoriaId": 1,
      "titulo": "Chocolate Meio Amargo 70%",
      "imagemUrl": "/produtos-chocolate/produtos/chocolate-meio-amargo-70.webp",
      "precoBaseCentavos": 1890,
      "descontoPercentual": 15,
      "precoFinalCentavos": 1607,
      "estoqueDisponivel": 32
    }
  ],
  "pagina": 1,
  "tamanho": 20,
  "total": 1
}
```

`GET /api/v1/produtos/2` — resposta.

```json
{
  "id": 2,
  "categoriaId": 1,
  "categoria": {"id": 1, "nome": "Chocolates em Barra", "ordem": 1},
  "titulo": "Chocolate Meio Amargo 70%",
  "descricao": "Chocolate com 70% de cacau e sabor intenso e equilibrado.",
  "imagemUrl": "/produtos-chocolate/produtos/chocolate-meio-amargo-70.webp",
  "precoBaseCentavos": 1890,
  "descontoPercentual": 15,
  "precoFinalCentavos": 1607,
  "estoqueDisponivel": 32
}
```

`POST /api/v1/carrinho/itens` — corpo de adição. Um retry da mesma intenção reutiliza a mesma `Idempotency-Key`.

```json
{"produtoId": 2, "quantidade": 2}
```

`PATCH /api/v1/carrinho/itens/2` — corpo de atualização. `If-Match` acompanha o request.

```json
{"quantidade": 2}
```

`GET /api/v1/carrinho` — resposta, também utilizada após mutações, com `ETag` no cabeçalho. Após remover o último item, `itens` é `[]` e os três totais são zero.

```json
{
  "id": "carrinho-exemplo",
  "versao": 3,
  "moeda": "BRL",
  "itens": [
    {
      "produtoId": 2,
      "titulo": "Chocolate Meio Amargo 70%",
      "imagemUrl": "/produtos-chocolate/produtos/chocolate-meio-amargo-70.webp",
      "quantidade": 2,
      "estoqueDisponivel": 32,
      "precoBaseCentavos": 1890,
      "precoFinalCentavos": 1607,
      "totalCentavos": 3214,
      "situacao": "DISPONIVEL"
    }
  ],
  "subtotalCentavos": 3780,
  "descontoCentavos": 566,
  "totalCentavos": 3214
}
```

`POST /api/v1/usuarios` — corpo.

```json
{
  "nomeCompleto": "Pessoa Exemplo",
  "email": "pessoa@example.com",
  "telefone": "+5511999999999",
  "endereco": {
    "cep": "01001000",
    "logradouro": "Praça da Sé",
    "numero": "100",
    "bairro": "Sé",
    "cidade": "São Paulo",
    "uf": "SP"
  },
  "senha": "<senha-escolhida-no-formulario>"
}
```

`POST /api/v1/sessao` — corpo.

```json
{"email": "pessoa@example.com", "senha": "<senha-informada>"}
```

Cadastro, login e `GET /api/v1/sessao` — projeção de resposta.

```json
{"usuario": {"id": "usuario-exemplo", "nomeCompleto": "Pessoa Exemplo", "email": "pessoa@example.com"}}
```

`POST /api/v1/recuperacoes-de-senha`, `POST /api/v1/recuperacoes-de-senha/validacoes` e `POST /api/v1/recuperacoes-de-senha/confirmacoes` — corpos, na mesma ordem.

```json
{"email": "pessoa@example.com"}
```

```json
{"token": "<token-recebido-por-email>"}
```

```json
{"token": "<token-recebido-por-email>", "novaSenha": "<nova-senha-escolhida>"}
```

Erro de validação de cadastro `422` — resposta.

```json
{
  "codigo": "VALIDACAO",
  "mensagem": "Revise os campos indicados.",
  "campos": {"endereco.cep": "Informe um CEP com oito dígitos."},
  "traceId": "referencia-da-requisicao"
}
```

Conflito de estoque `409` — resposta. Exibir a disponibilidade retornada e sincronizar o detalhe ou o carrinho antes de uma nova tentativa.

```json
{
  "codigo": "ESTOQUE_INSUFICIENTE",
  "mensagem": "A quantidade solicitada ultrapassa o estoque.",
  "campos": {"quantidade": "Selecione uma quantidade disponível."},
  "detalhes": {"produtoId": 2, "estoqueDisponivel": 1}
}
```

### 12.6. Fluxos de integração e tratamento de erros

| Tela / evento | Operações e atualização esperada |
| --- | --- |
| Inicialização e navegação | Consultar `GET /sessao` uma vez ao iniciar a aplicação. Durante a consulta, diferir decisões de rota protegida. `401` no bootstrap significa visitante; falha de rede oferece nova tentativa. Guards controlam navegação, e o servidor autoriza cada ação |
| Vitrine | Consultar categorias e páginas de produtos filtradas por ID. Exibir carregamento, falha e nova tentativa por faixa; vazio sem cartões falsos. **PENDENTE** — opção agregada se a latência justificar, sem alterar ordem ou categoria |
| Busca | Derivar termo da URL e preservar links compartilháveis. Debounce e cancelamento de consulta anterior ao digitar, submit imediato, estado vazio para `200` sem itens, retry para erro e carregar mais sem repetir itens. Limpar a busca volta à vitrine |
| Detalhe | Consultar produto ao mudar o ID, reinicializar quantidade, tratar `404`, erro transitório e disponibilidade zero. Para adição sem contexto de carrinho inicializado, consultar `GET /carrinho` uma vez para obter o cookie de visitante e preparar a proteção CSRF. Em seguida, fazer `POST`, atualizar carrinho local com o retorno e apresentar feedback sem mudar de rota. Em `409`, sincronizar estoque e manter controle editável |
| Carrinho | `GET` ao entrar. `PATCH` envia quantidade absoluta e `DELETE` remove por produto. Enquanto cada mutação estiver pendente, serializar operações do carrinho ou evitar que respostas fora de ordem sobrescrevam a versão atual. Em sucesso, usar totais do servidor. `412` ou estoque alterado pede atualização e nova intenção explícita. Falhas deixam visível o último estado confirmado |
| Cadastro e login | Validar campos no Angular, suspender submit durante envio, atualizar estado autenticado a partir do retorno e navegar ao início. Mapear `422` e `409` para campos do cadastro; `401` no login é mensagem uniforme. Revalidar carrinho depois de mudança de sessão |
| Conta e saída | Usar dados da sessão. Após `204`, limpar o estado do usuário e navegar para login; em erro transitório, comunicar falha e permitir retry. Navegação para login/cadastro com sessão ativa continua levando à conta |
| Recuperação | Solicitar, verificar e confirmar pelo fluxo da seção 9. `429` mostra espera e respeita `Retry-After` quando informado; token inválido ou expirado conduz a nova solicitação. Não emitir telemetria com e-mail sensível, token, senha ou corpo de autenticação |

**Autenticação proposta** — Preferir API e SPA na mesma origem, com cookie de sessão opaco `HttpOnly`, `Secure` e política `SameSite` compatível com o deployment. Usar defesa CSRF e validação de origem nas mutações que dependem de cookie, incluindo login, cadastro e carrinho. Se a API for separada por origem, decidir CORS, credenciais e tratamento de CSRF explicitamente. Renovar o identificador ao autenticar e revogá-lo ao sair. O servidor obtém o proprietário de conta ou carrinho do contexto validado, sem aceitar ID de usuário indicado pelo cliente. Política de vinculação de carrinho visitante à conta deve ser definida antes da implementação. Campos sensíveis ficam fora de respostas, logs e armazenamento web.

**Troca de sessão e carrinho** — O React mantém a mesma lista local ao entrar e sair. Para preservar a continuidade do visitante, a proposta é transferir o carrinho anônimo para o contexto autenticado no login/cadastro quando ainda não houver carrinho da conta. Se ambos existirem, a regra de combinação e o tratamento de conflitos ficam **PENDENTE**. A transferência deve ser atômica, idempotente e restrita ao visitante identificado no momento da autenticação. Após sair, limpar os dados do carrinho da conta em memória e consultar o contexto anônimo vigente. A preservação dos itens nesse contexto fica **PENDENTE**; ela precisa impedir exposição do carrinho privado em navegador compartilhado.

**Erros propostos** — `401` fora da tentativa de login invalida a sessão protegida quando aplicável, `403` indica falta de permissão ou rejeição de segurança, `404` tem mensagem contextual, `409` comunica conflito de negócio, `412` pede recarga, `422` distribui erros por campo e `429` apresenta espera. Falha de rede ou `5xx` exibe estado recuperável. Não repetir mutações automaticamente sem semântica de idempotência e a mesma chave quando exigida.

## 13. Diretrizes para migração React → Angular

| Padrão no React | Organização Angular proposta |
| --- | --- |
| Shell e `BrowserRouter` | Shell com cabeçalho, navegação, rodapé e `router-outlet`. Rotas do mapa, parâmetros de produto e busca na URL. Guard de conta, guard de visitante para login/cadastro e fallback de hospedagem. Rota de página desconhecida como melhoria |
| Componentes de rota, carrossel e item | Organizar por catálogo, carrinho e conta. Páginas de rota orquestram dados; componentes compartilhados apresentam cartão, imagem, preço, controle de quantidade, campos e feedback mediante inputs/outputs |
| `useState` / `useRef` | Signals ou estado local tipado para seleção e status visual; fluxo reativo para query e HTTP; referência local ao elemento rolável para navegação do carrossel. Manter sessão e carrinho confirmados em serviços de escopo da aplicação |
| Formulários controlados | Reactive Forms tipados com validações de campo e validação cruzada de confirmação. Normalizar dados antes de montar DTO; manter máscara apenas no formulário |
| Acesso direto a array/storage | `CatalogoService` consulta categorias, produtos e detalhe; `CarrinhoService` consulta e altera itens, trata ETag/idempotência; `SessaoService` carrega sessão, cadastra, autentica e encerra; `RecuperacaoSenhaService` encapsula o fluxo de recuperação |
| Tipos usados diretamente na renderização | Definir interfaces de domínio, DTOs de rede e view models em módulos por domínio. Mapear DTOs em adaptadores finos. Manter máscaras, estado e formatação de BRL na interface. Nenhuma duplicação de totais do servidor como fonte de verdade |
| CSS global e por componente | Criar tokens CSS para paleta, tipografia, espaçamento e raios. Estilos locais de apresentação e regras mobile-first. Preservar arquivos de mídia e verificar a base de URL publicada |

Configurar `API_BASE_URL` via injeção por ambiente, com proxy local se adotado. Centralizar normalização de erros e associação de códigos a estados de UI. Usar interceptors para credenciais e CSRF quando exigido pela arquitetura, e para correlacionar falhas sem incluir dados sensíveis. Serviços mantêm regras específicas de endpoints e mapeiam DTOs. O interceptor deve evitar redirecionar loops de login, tratar `401` do bootstrap como visitante e deixar o formulário lidar com credenciais inválidas. O backend deverá usar Java 21 com Spring Boot e PostgreSQL, conforme seção 13.1. Versão de Angular e hospedagem ficam em aberto.

### 13.1. Planejamento do backend e ambiente de execução

**NOVO REQUISITO** — O backend futuro deverá ser implementado em Java 21 com Spring Boot, usando PostgreSQL para persistência. A preferência é executar backend e banco em containers coordenados por Docker Compose. Essa definição orienta a implementação futura em `backend/`.

| Parte | Diretriz para implementação futura |
| --- | --- |
| API Spring Boot | Implementar os contratos propostos da seção 12 em controllers REST, com validação dos DTOs, services para regras de negócio e camada de persistência separada. Traduzir erros para o formato e códigos HTTP documentados |
| Persistência PostgreSQL | Representar as entidades e relacionamentos da seção 12, aplicar unicidade e integridade referencial no banco e usar transações nas operações de estoque, carrinho e recuperação de senha. Versionar alterações de schema com ferramenta de migrations a definir |
| Segurança | Integrar autenticação, autorização, hash de senha e proteção de sessão com Spring Security. Seguir o fluxo de cookie e CSRF proposto na seção 12.6, sujeito à definição da origem de implantação |
| Container do backend | Preferir Dockerfile em `backend/`, build em múltiplos estágios e runtime Java 21. Configurar conexão, credenciais e perfis por ambiente |
| Docker Compose | Prever `compose.yaml` na raiz com serviços de API e PostgreSQL, rede interna, volume nomeado para os dados e healthcheck do banco. A API usa o nome do serviço do banco como host. Coordenar inicialização com prontidão do banco e tratamento de conexão na API |
| Configuração local | Documentar variáveis de ambiente e valores de exemplo sem credenciais reais. Separar configuração de desenvolvimento e produção. Definir portas publicadas durante a implementação |
| Integração Angular | Manter DTOs HTTP independentes das entidades de persistência Java. Configurar URL da API por ambiente e validar em conjunto os exemplos e contratos da seção 12 |

**PENDENTE** — Escolher versões específicas de Spring Boot e PostgreSQL, ferramenta de build Java, biblioteca de acesso a dados e ferramenta de migrations. Verificar compatibilidade e suporte das versões no início da implementação. Definir também estratégia de backup, publicação em produção e eventual inclusão do frontend no Compose.

A futura validação deverá verificar inicialização por `docker compose up --build`, conexão da API com PostgreSQL, aplicação das migrations e preservação dos dados após recriação dos containers com o volume mantido.

## 14. Critérios de aceitação

1. As sete rotas atuais funcionam por navegação e URL direta, inclusive deep link de produto e consulta de busca. Login/cadastro com sessão abrem a conta, conta sem sessão volta ao login e sair revoga a sessão.
2. A vitrine lista as quatro categorias na ordem configurada, com cartões ligados ao produto e carrossel navegável por teclado, botões e toque. A busca mantém substring por título sem distinção de caixa, preserva diacríticos e apresenta termo, resultados, vazio e falha.
3. Detalhe mostra título, descrição, categoria, imagem e preço. Para ID ausente ou erro de API apresenta feedback distinto. Quantidade permanece válida entre 1 e estoque quando há estoque. Estoque zero bloqueia adição.
4. Visitante pode adicionar produto, acumular quantidade no mesmo item, alterar quantidade, remover e recuperar o carrinho ao recarregar no mesmo navegador conforme política de sessão. O resumo usa valores do servidor e o vazio oferece retorno à vitrine. Repetir requisição de adição com a mesma chave não soma novamente.
5. Cadastro usa nome, e-mail, telefone, endereço, senha e confirmação com mensagens por campo; inclui CPF e data somente conforme as decisões pendentes. E-mail duplicado recebe feedback. Cadastro e login bem-sucedidos chegam à vitrine e o usuário é reconhecido na recarga.
6. Recuperação tem solicitação com resposta uniforme, entrega de link para conta elegível, expiração, rejeição de token reutilizado, atualização da senha e indicação de sucesso. Repetição e abuso são tratados. Senhas, credenciais e tokens não ficam em armazenamento web ou logs.
7. A aplicação carrega dados de APIs reais. Contas e catálogo simulados não são usados como fonte definitiva; arquivos de imagem são reaproveitados, com 40 referências de catálogo válidas e `banner2.jpg` exibido no cabeçalho.
8. Cabeçalho, rodapé, cartões, preços promocionais, formulários e carrinho preservam a identidade da seção 7. Nos tamanhos de tela da seção 10, ações e campos permanecem visíveis, a rolagem horizontal fica confinada aos carrosséis, preços e títulos não são cortados e há feedback acessível de carregamento, vazio, erro e sucesso.
9. «Prosseguir» não cria pedido ou pagamento sem requisito aprovado. Sua apresentação ou ocultação na versão Angular deve seguir a decisão explícita do produto.

10. O backend usa Java 21, Spring Boot e PostgreSQL. No ambiente preferencial com Docker Compose, API e banco iniciam, a API acessa o banco e os dados persistem no volume após recriação dos containers.

## 15. Pendências e decisões em aberto

| PENDENTE | Decisão necessária |
| --- | --- |
| Checkout, pedido, entrega, pagamento e estoque | Definir se entram no escopo e o que acontece com «Prosseguir». Definir ciclo de reserva, preço vigente e indisponibilidade. Nenhum contrato de pedido foi criado a partir do botão inerte |
| Arredondamento e consistência comercial | Aprovar regra por unidade/linha, totais de item indisponível, prazo de validade de valores e política de reprecificação |
| Conta e privacidade | Aprovar finalidade e obrigatoriedade de data de nascimento, CPF e endereço no cadastro, uso de telefone e necessidade de verificar e-mail. Definir validações de negócio e retenção |
| Sessão e recuperação | Definir prazo de sessão, revogação após troca de senha, prazo e política de reemissão de token, provedor de e-mail, política de senha, limites de tentativas e confirmação de cadastro |
| Carrinho anônimo e legado | Definir duração, merge/vinculação após login e efeito do logout. Decidir se carrinho local antigo será descartado ou importado. Se importado, considerar somente IDs/quantidades após validação e reconstruir preços pelo servidor. Contas locais com senhas em texto claro ficam fora da importação |
| Origem e migração de catálogo | Definir fonte oficial, IDs preservados para URLs históricas, ordem além do ID, operação editorial, CDN/publicação e política de imagem ausente. A identidade dos arquivos de mídia deve ser preservada |
| Implantação e suporte | Definir versões de Spring Boot e PostgreSQL compatíveis com Java 21, ferramenta de build Java, versão Angular, base pública e origem da API, ambientes, navegadores, metas de desempenho e disponibilidade. Priorizar containers e Docker Compose conforme seção 13.1 |
| Contato e copy | Confirmar telefone, endereço, horário e e-mail do rodapé. Não há serviço de atendimento implementado na aplicação |

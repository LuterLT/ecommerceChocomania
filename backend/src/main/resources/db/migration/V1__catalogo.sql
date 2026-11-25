CREATE TABLE categorias (
    id BIGINT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL CHECK (length(trim(nome)) > 0),
    ordem INTEGER NOT NULL CHECK (ordem >= 0)
);

CREATE TABLE produtos (
    id BIGINT PRIMARY KEY,
    categoria_id BIGINT NOT NULL REFERENCES categorias(id),
    titulo VARCHAR(200) NOT NULL CHECK (length(trim(titulo)) > 0),
    descricao TEXT NOT NULL CHECK (length(trim(descricao)) > 0),
    imagem_url VARCHAR(500) NOT NULL,
    preco_base_centavos INTEGER NOT NULL CHECK (preco_base_centavos >= 0),
    desconto_percentual INTEGER NOT NULL CHECK (desconto_percentual BETWEEN 0 AND 100),
    estoque_disponivel INTEGER NOT NULL CHECK (estoque_disponivel >= 0)
);

CREATE INDEX produtos_categoria_id_idx ON produtos(categoria_id);

INSERT INTO categorias (id, nome, ordem) VALUES
    (1, 'Chocolates em Barra', 1),
    (2, 'Bombons', 2),
    (3, 'Trufas', 3),
    (4, 'Bebidas e Cremes de Chocolate', 4);

INSERT INTO produtos (id, categoria_id, titulo, descricao, imagem_url, preco_base_centavos, desconto_percentual, estoque_disponivel) VALUES
    (1, 1, 'Chocolate ao Leite', 'Barra de chocolate ao leite com textura cremosa e sabor suave.', '/produtos-chocolate/produtos/chocolate-ao-leite.webp', 1290, 0, 45),
    (2, 1, 'Chocolate Meio Amargo 70%', 'Chocolate com 70% de cacau e sabor intenso e equilibrado.', '/produtos-chocolate/produtos/chocolate-meio-amargo-70.webp', 1890, 15, 32),
    (3, 1, 'Chocolate Branco Cremoso', 'Chocolate branco com textura cremosa e sabor delicadamente adocicado.', '/produtos-chocolate/produtos/chocolate-branco-cremoso.webp', 1490, 0, 28),
    (4, 1, 'Chocolate com Castanhas', 'Barra de chocolate ao leite com pedaços crocantes de castanhas.', '/produtos-chocolate/produtos/chocolate-com-castanhas.webp', 2190, 0, 24),
    (5, 1, 'Chocolate com Avelã', 'Chocolate ao leite combinado com pedaços de avelã torrada.', '/produtos-chocolate/produtos/chocolate-com-avela.webp', 1990, 10, 36),
    (6, 1, 'Chocolate 85% Cacau', 'Chocolate intenso com alta concentração de cacau e baixo teor de açúcar.', '/produtos-chocolate/produtos/chocolate-85-cacau.webp', 2290, 0, 18),
    (7, 1, 'Chocolate com Caramelo', 'Barra de chocolate ao leite recheada com caramelo cremoso.', '/produtos-chocolate/produtos/chocolate-com-caramelo.webp', 1790, 18, 30),
    (8, 1, 'Chocolate Crocante', 'Chocolate ao leite com flocos crocantes de arroz.', '/produtos-chocolate/produtos/chocolate-crocante.webp', 1390, 0, 40),
    (9, 1, 'Chocolate com Coco', 'Chocolate ao leite combinado com coco ralado e textura macia.', '/produtos-chocolate/produtos/chocolate-com-coco.webp', 1590, 10, 25),
    (10, 1, 'Chocolate Intenso 60%', 'Chocolate com 60% de cacau, equilibrando doçura e intensidade.', '/produtos-chocolate/produtos/chocolate-intenso-60.webp', 1690, 0, 34),
    (11, 2, 'Bombom de Morango', 'Bombom de chocolate ao leite com recheio cremoso de morango.', '/produtos-chocolate/produtos/bombom-de-morango.webp', 690, 0, 60),
    (12, 2, 'Bombom de Avelã', 'Bombom recheado com creme de avelã e cobertura de chocolate.', '/produtos-chocolate/produtos/bombom-de-avela.webp', 790, 15, 48),
    (13, 2, 'Bombom de Caramelo', 'Bombom de chocolate recheado com caramelo cremoso.', '/produtos-chocolate/produtos/bombom-de-caramelo.webp', 650, 0, 55),
    (14, 2, 'Bombom de Coco', 'Bombom de chocolate com recheio cremoso de coco.', '/produtos-chocolate/produtos/bombom-de-coco.webp', 690, 12, 42),
    (15, 2, 'Bombom de Maracujá', 'Chocolate ao leite com recheio cremoso e levemente ácido de maracujá.', '/produtos-chocolate/produtos/bombom-de-maracuja.webp', 750, 0, 38),
    (16, 2, 'Bombom de Amendoim', 'Bombom de chocolate com recheio de creme de amendoim.', '/produtos-chocolate/produtos/bombom-de-amendoim.webp', 690, 0, 50),
    (17, 2, 'Bombom Crocante', 'Chocolate recheado com creme e pequenos pedaços crocantes.', '/produtos-chocolate/produtos/bombom-crocante.webp', 590, 8, 65),
    (18, 2, 'Bombom de Café', 'Bombom de chocolate amargo com recheio cremoso de café.', '/produtos-chocolate/produtos/bombom-de-cafe.webp', 890, 0, 35),
    (19, 2, 'Bombom de Baunilha', 'Chocolate ao leite com recheio suave de creme de baunilha.', '/produtos-chocolate/produtos/bombom-de-baunilha.webp', 650, 10, 44),
    (20, 2, 'Bombom de Cereja', 'Bombom de chocolate com recheio cremoso e pedaços de cereja.', '/produtos-chocolate/produtos/bombom-de-cereja.webp', 850, 0, 30),
    (21, 3, 'Trufa Tradicional', 'Trufa clássica de chocolate com recheio cremoso e cobertura de cacau.', '/produtos-chocolate/produtos/trufa-tradicional.webp', 890, 10, 40),
    (22, 3, 'Trufa de Morango', 'Trufa de chocolate recheada com creme de morango.', '/produtos-chocolate/produtos/trufa-de-morango.webp', 990, 0, 32),
    (23, 3, 'Trufa de Maracujá', 'Trufa de chocolate meio amargo com recheio de maracujá.', '/produtos-chocolate/produtos/trufa-de-maracuja.webp', 950, 0, 28),
    (24, 3, 'Trufa de Café', 'Trufa intensa de chocolate com recheio cremoso de café.', '/produtos-chocolate/produtos/trufa-de-cafe.webp', 1090, 20, 25),
    (25, 3, 'Trufa de Avelã', 'Trufa de chocolate recheada com creme de avelã.', '/produtos-chocolate/produtos/trufa-de-avela.webp', 1190, 0, 30),
    (26, 3, 'Trufa de Coco', 'Trufa de chocolate branco com recheio cremoso de coco.', '/produtos-chocolate/produtos/trufa-de-coco.webp', 990, 8, 36),
    (27, 3, 'Trufa de Pistache', 'Trufa de chocolate branco com recheio delicado de pistache.', '/produtos-chocolate/produtos/trufa-de-pistache.webp', 1290, 0, 20),
    (28, 3, 'Trufa de Caramelo Salgado', 'Chocolate recheado com caramelo cremoso e toque de sal.', '/produtos-chocolate/produtos/trufa-de-caramelo-salgado.webp', 1150, 0, 22),
    (29, 3, 'Trufa de Laranja', 'Trufa de chocolate meio amargo com notas cítricas de laranja.', '/produtos-chocolate/produtos/trufa-de-laranja.webp', 990, 10, 27),
    (30, 3, 'Trufa de Doce de Leite', 'Trufa de chocolate ao leite recheada com doce de leite cremoso.', '/produtos-chocolate/produtos/trufa-de-doce-de-leite.webp', 1090, 20, 34),
    (31, 4, 'Chocolate Quente Cremoso', 'Bebida quente preparada com chocolate e leite, com textura cremosa.', '/produtos-chocolate/produtos/chocolate-quente-cremoso.webp', 1490, 0, 20),
    (32, 4, 'Chocolate Quente com Canela', 'Chocolate quente cremoso com um toque aromático de canela.', '/produtos-chocolate/produtos/chocolate-quente-com-canela.webp', 1590, 15, 18),
    (33, 4, 'Cappuccino de Chocolate', 'Cappuccino cremoso combinado com chocolate e espuma de leite.', '/produtos-chocolate/produtos/cappuccino-de-chocolate.webp', 1690, 0, 25),
    (34, 4, 'Chocolate Gelado', 'Bebida gelada de chocolate com leite e textura cremosa.', '/produtos-chocolate/produtos/chocolate-gelado.webp', 1390, 0, 30),
    (35, 4, 'Milkshake de Chocolate', 'Milkshake cremoso de chocolate servido bem gelado.', '/produtos-chocolate/produtos/milkshake-de-chocolate.webp', 1990, 20, 15),
    (36, 4, 'Creme de Chocolate com Avelã', 'Creme de chocolate com avelãs para acompanhar pães, frutas e sobremesas.', '/produtos-chocolate/produtos/creme-de-chocolate-com-avela.webp', 2490, 0, 22),
    (37, 4, 'Creme de Chocolate Branco', 'Creme suave de chocolate branco para sobremesas e recheios.', '/produtos-chocolate/produtos/creme-de-chocolate-branco.webp', 2290, 0, 19),
    (38, 4, 'Chocolate Quente com Marshmallow', 'Chocolate quente cremoso acompanhado de marshmallows macios.', '/produtos-chocolate/produtos/chocolate-quente-com-marshmallow.webp', 1890, 15, 17),
    (39, 4, 'Mocha de Chocolate', 'Bebida cremosa que combina café espresso, leite e chocolate.', '/produtos-chocolate/produtos/mocha-de-chocolate.webp', 1790, 0, 24),
    (40, 4, 'Creme de Chocolate Amargo', 'Creme intenso preparado com chocolate de alta concentração de cacau.', '/produtos-chocolate/produtos/creme-de-chocolate-amargo.webp', 2690, 0, 14);

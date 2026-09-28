export interface Produto {
    id: number;
    titulo: string;
    descricao: string;
    categoria: string;
    preco: number;
    desconto: number;
    imagem: string;
    popularidade: boolean;
    quantidade: number;
}

export const produtos: Produto[] = [
    // ============================
    // CHOCOLATES EM BARRA - 10
    // ============================
    {
        id: 1,
        titulo: "Chocolate ao Leite",
        descricao: "Barra de chocolate ao leite com textura cremosa e sabor suave.",
        categoria: "Chocolates em Barra",
        preco: 12.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 45
    },
    {
        id: 2,
        titulo: "Chocolate Meio Amargo 70%",
        descricao: "Chocolate com 70% de cacau e sabor intenso e equilibrado.",
        categoria: "Chocolates em Barra",
        preco: 18.90,
        desconto: 15,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 32
    },
    {
        id: 3,
        titulo: "Chocolate Branco Cremoso",
        descricao: "Chocolate branco com textura cremosa e sabor delicadamente adocicado.",
        categoria: "Chocolates em Barra",
        preco: 14.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 28
    },
    {
        id: 4,
        titulo: "Chocolate com Castanhas",
        descricao: "Barra de chocolate ao leite com pedaços crocantes de castanhas.",
        categoria: "Chocolates em Barra",
        preco: 21.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 24
    },
    {
        id: 5,
        titulo: "Chocolate com Avelã",
        descricao: "Chocolate ao leite combinado com pedaços de avelã torrada.",
        categoria: "Chocolates em Barra",
        preco: 19.90,
        desconto: 10,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 36
    },
    {
        id: 6,
        titulo: "Chocolate 85% Cacau",
        descricao: "Chocolate intenso com alta concentração de cacau e baixo teor de açúcar.",
        categoria: "Chocolates em Barra",
        preco: 22.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 18
    },
    {
        id: 7,
        titulo: "Chocolate com Caramelo",
        descricao: "Barra de chocolate ao leite recheada com caramelo cremoso.",
        categoria: "Chocolates em Barra",
        preco: 17.90,
        desconto: 18,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 30
    },
    {
        id: 8,
        titulo: "Chocolate Crocante",
        descricao: "Chocolate ao leite com flocos crocantes de arroz.",
        categoria: "Chocolates em Barra",
        preco: 13.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 40
    },
    {
        id: 9,
        titulo: "Chocolate com Coco",
        descricao: "Chocolate ao leite combinado com coco ralado e textura macia.",
        categoria: "Chocolates em Barra",
        preco: 15.90,
        desconto: 10,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 25
    },
    {
        id: 10,
        titulo: "Chocolate Intenso 60%",
        descricao: "Chocolate com 60% de cacau, equilibrando doçura e intensidade.",
        categoria: "Chocolates em Barra",
        preco: 16.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 34
    },

    // ============================
    // BOMBONS - 10
    // ============================
    {
        id: 11,
        titulo: "Bombom de Morango",
        descricao: "Bombom de chocolate ao leite com recheio cremoso de morango.",
        categoria: "Bombons",
        preco: 6.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 60
    },
    {
        id: 12,
        titulo: "Bombom de Avelã",
        descricao: "Bombom recheado com creme de avelã e cobertura de chocolate.",
        categoria: "Bombons",
        preco: 7.90,
        desconto: 15,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 48
    },
    {
        id: 13,
        titulo: "Bombom de Caramelo",
        descricao: "Bombom de chocolate recheado com caramelo cremoso.",
        categoria: "Bombons",
        preco: 6.50,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 55
    },
    {
        id: 14,
        titulo: "Bombom de Coco",
        descricao: "Bombom de chocolate com recheio cremoso de coco.",
        categoria: "Bombons",
        preco: 6.90,
        desconto: 12,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 42
    },
    {
        id: 15,
        titulo: "Bombom de Maracujá",
        descricao: "Chocolate ao leite com recheio cremoso e levemente ácido de maracujá.",
        categoria: "Bombons",
        preco: 7.50,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 38
    },
    {
        id: 16,
        titulo: "Bombom de Amendoim",
        descricao: "Bombom de chocolate com recheio de creme de amendoim.",
        categoria: "Bombons",
        preco: 6.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 50
    },
    {
        id: 17,
        titulo: "Bombom Crocante",
        descricao: "Chocolate recheado com creme e pequenos pedaços crocantes.",
        categoria: "Bombons",
        preco: 5.90,
        desconto: 8,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 65
    },
    {
        id: 18,
        titulo: "Bombom de Café",
        descricao: "Bombom de chocolate amargo com recheio cremoso de café.",
        categoria: "Bombons",
        preco: 8.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 35
    },
    {
        id: 19,
        titulo: "Bombom de Baunilha",
        descricao: "Chocolate ao leite com recheio suave de creme de baunilha.",
        categoria: "Bombons",
        preco: 6.50,
        desconto: 10,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 44
    },
    {
        id: 20,
        titulo: "Bombom de Cereja",
        descricao: "Bombom de chocolate com recheio cremoso e pedaços de cereja.",
        categoria: "Bombons",
        preco: 8.50,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 30
    },

    // ============================
    // TRUFAS - 10
    // ============================
    {
        id: 21,
        titulo: "Trufa Tradicional",
        descricao: "Trufa clássica de chocolate com recheio cremoso e cobertura de cacau.",
        categoria: "Trufas",
        preco: 8.90,
        desconto: 10,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 40
    },
    {
        id: 22,
        titulo: "Trufa de Morango",
        descricao: "Trufa de chocolate recheada com creme de morango.",
        categoria: "Trufas",
        preco: 9.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 32
    },
    {
        id: 23,
        titulo: "Trufa de Maracujá",
        descricao: "Trufa de chocolate meio amargo com recheio de maracujá.",
        categoria: "Trufas",
        preco: 9.50,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 28
    },
    {
        id: 24,
        titulo: "Trufa de Café",
        descricao: "Trufa intensa de chocolate com recheio cremoso de café.",
        categoria: "Trufas",
        preco: 10.90,
        desconto: 20,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 25
    },
    {
        id: 25,
        titulo: "Trufa de Avelã",
        descricao: "Trufa de chocolate recheada com creme de avelã.",
        categoria: "Trufas",
        preco: 11.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 30
    },
    {
        id: 26,
        titulo: "Trufa de Coco",
        descricao: "Trufa de chocolate branco com recheio cremoso de coco.",
        categoria: "Trufas",
        preco: 9.90,
        desconto: 8,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 36
    },
    {
        id: 27,
        titulo: "Trufa de Pistache",
        descricao: "Trufa de chocolate branco com recheio delicado de pistache.",
        categoria: "Trufas",
        preco: 12.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 20
    },
    {
        id: 28,
        titulo: "Trufa de Caramelo Salgado",
        descricao: "Chocolate recheado com caramelo cremoso e toque de sal.",
        categoria: "Trufas",
        preco: 11.50,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 22
    },
    {
        id: 29,
        titulo: "Trufa de Laranja",
        descricao: "Trufa de chocolate meio amargo com notas cítricas de laranja.",
        categoria: "Trufas",
        preco: 9.90,
        desconto: 10,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 27
    },
    {
        id: 30,
        titulo: "Trufa de Doce de Leite",
        descricao: "Trufa de chocolate ao leite recheada com doce de leite cremoso.",
        categoria: "Trufas",
        preco: 10.90,
        desconto: 20,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 34
    },

    // ==========================================
    // BEBIDAS E CREMES DE CHOCOLATE - 10
    // ==========================================
    {
        id: 31,
        titulo: "Chocolate Quente Cremoso",
        descricao: "Bebida quente preparada com chocolate e leite, com textura cremosa.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 14.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 20
    },
    {
        id: 32,
        titulo: "Chocolate Quente com Canela",
        descricao: "Chocolate quente cremoso com um toque aromático de canela.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 15.90,
        desconto: 15,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 18
    },
    {
        id: 33,
        titulo: "Cappuccino de Chocolate",
        descricao: "Cappuccino cremoso combinado com chocolate e espuma de leite.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 16.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 25
    },
    {
        id: 34,
        titulo: "Chocolate Gelado",
        descricao: "Bebida gelada de chocolate com leite e textura cremosa.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 13.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 30
    },
    {
        id: 35,
        titulo: "Milkshake de Chocolate",
        descricao: "Milkshake cremoso de chocolate servido bem gelado.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 19.90,
        desconto: 20,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 15
    },
    {
        id: 36,
        titulo: "Creme de Chocolate com Avelã",
        descricao: "Creme de chocolate com avelãs para acompanhar pães, frutas e sobremesas.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 24.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 22
    },
    {
        id: 37,
        titulo: "Creme de Chocolate Branco",
        descricao: "Creme suave de chocolate branco para sobremesas e recheios.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 22.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 19
    },
    {
        id: 38,
        titulo: "Chocolate Quente com Marshmallow",
        descricao: "Chocolate quente cremoso acompanhado de marshmallows macios.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 18.90,
        desconto: 15,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 17
    },
    {
        id: 39,
        titulo: "Mocha de Chocolate",
        descricao: "Bebida cremosa que combina café espresso, leite e chocolate.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 17.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: false,
        quantidade: 24
    },
    {
        id: 40,
        titulo: "Creme de Chocolate Amargo",
        descricao: "Creme intenso preparado com chocolate de alta concentração de cacau.",
        categoria: "Bebidas e Cremes de Chocolate",
        preco: 26.90,
        desconto: 0,
        imagem: "/ProdutoSemImagem.webp",
        popularidade: true,
        quantidade: 14
    }
];


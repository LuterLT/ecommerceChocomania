CREATE TABLE carrinhos (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id BIGINT UNIQUE REFERENCES usuarios(id),
    versao BIGINT NOT NULL DEFAULT 1 CHECK (versao >= 1)
);

CREATE TABLE itens_carrinho (
    carrinho_id VARCHAR(36) NOT NULL REFERENCES carrinhos(id) ON DELETE CASCADE,
    produto_id BIGINT NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (carrinho_id, produto_id)
);

CREATE TABLE operacoes_carrinho (
    carrinho_id VARCHAR(36) NOT NULL REFERENCES carrinhos(id) ON DELETE CASCADE,
    chave VARCHAR(128) NOT NULL,
    produto_id BIGINT NOT NULL,
    quantidade INTEGER NOT NULL,
    PRIMARY KEY (carrinho_id, chave)
);

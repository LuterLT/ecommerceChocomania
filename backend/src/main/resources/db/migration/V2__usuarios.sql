CREATE TABLE usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_completo VARCHAR(120) NOT NULL CHECK (length(trim(nome_completo)) > 0),
    email VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(trim(email))),
    senha_hash VARCHAR(100) NOT NULL,
    data_nascimento DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

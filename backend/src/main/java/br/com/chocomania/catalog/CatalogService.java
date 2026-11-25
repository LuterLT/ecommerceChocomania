package br.com.chocomania.catalog;

import br.com.chocomania.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CatalogService {
    private final JdbcTemplate jdbc;

    public CatalogService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<CategoriaDto> categorias() {
        return jdbc.query("SELECT id, nome, ordem FROM categorias ORDER BY ordem, id",
                (rs, row) -> new CategoriaDto(rs.getLong("id"), rs.getString("nome"), rs.getInt("ordem")));
    }

    public PaginaDto<ProdutoResumoDto> produtos(Long categoriaId, String busca, int pagina, int tamanho) {
        if (pagina < 1 || tamanho < 1 || tamanho > 100 || (categoriaId != null && categoriaId < 1)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PARAMETRO_INVALIDO",
                    "Informe página positiva, tamanho entre 1 e 100 e categoria positiva.");
        }
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        List<Object> args = new ArrayList<>();
        if (categoriaId != null) {
            where.append(" AND categoria_id = ?");
            args.add(categoriaId);
        }
        if (busca != null && !busca.isBlank()) {
            where.append(" AND position(lower(?) in lower(titulo)) > 0");
            args.add(busca.trim());
        }
        Long total = jdbc.queryForObject("SELECT count(*) FROM produtos" + where, Long.class, args.toArray());
        args.add(tamanho);
        args.add(((long) pagina - 1) * tamanho);
        List<ProdutoResumoDto> itens = jdbc.query("SELECT * FROM produtos" + where + " ORDER BY id LIMIT ? OFFSET ?",
                (rs, row) -> new ProdutoResumoDto(rs.getLong("id"), rs.getLong("categoria_id"),
                        rs.getString("titulo"), rs.getString("imagem_url"), rs.getInt("preco_base_centavos"),
                        rs.getInt("desconto_percentual"), precoFinal(rs.getInt("preco_base_centavos"),
                        rs.getInt("desconto_percentual")), rs.getInt("estoque_disponivel")), args.toArray());
        return new PaginaDto<>(itens, pagina, tamanho, total == null ? 0 : total);
    }

    public ProdutoDetalheDto produto(long id) {
        if (id < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PARAMETRO_INVALIDO", "Informe um produto positivo.");
        }
        return jdbc.query("""
                SELECT p.*, c.nome AS categoria_nome, c.ordem AS categoria_ordem
                FROM produtos p JOIN categorias c ON c.id = p.categoria_id WHERE p.id = ?
                """, (rs, row) -> new ProdutoDetalheDto(rs.getLong("id"), rs.getLong("categoria_id"),
                rs.getString("titulo"), rs.getString("imagem_url"), rs.getInt("preco_base_centavos"),
                rs.getInt("desconto_percentual"), precoFinal(rs.getInt("preco_base_centavos"),
                rs.getInt("desconto_percentual")), rs.getInt("estoque_disponivel"), rs.getString("descricao"),
                new CategoriaDto(rs.getLong("categoria_id"), rs.getString("categoria_nome"),
                        rs.getInt("categoria_ordem"))), id).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PRODUTO_NAO_ENCONTRADO",
                        "Produto não encontrado."));
    }

    public static int precoFinal(int precoBaseCentavos, int descontoPercentual) {
        return Math.toIntExact(((long) precoBaseCentavos * (100 - descontoPercentual) + 50) / 100);
    }

    public record CategoriaDto(long id, String nome, int ordem) {}

    public record ProdutoResumoDto(long id, long categoriaId, String titulo, String imagemUrl,
                                   int precoBaseCentavos, int descontoPercentual, int precoFinalCentavos,
                                   int estoqueDisponivel) {}

    public record ProdutoDetalheDto(long id, long categoriaId, String titulo, String imagemUrl,
                                   int precoBaseCentavos, int descontoPercentual, int precoFinalCentavos,
                                   int estoqueDisponivel, String descricao, CategoriaDto categoria) {}

    public record PaginaDto<T>(List<T> itens, int pagina, int tamanho, long total) {}
}

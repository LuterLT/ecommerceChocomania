package br.com.chocomania.cart;

import br.com.chocomania.common.ApiException;
import br.com.chocomania.auth.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CartService {
    private final JdbcTemplate jdbc;

    public CartService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Cart get(HttpSession session) {
        return view(resolve(session));
    }

    public Order checkout(HttpSession session, String version) {
        if (!(session.getAttribute("usuarioId") instanceof Long)) {
            throw AuthService.sessaoInvalida();
        }
        var cartId = resolve(session);
        checkVersion(cartId, version);
        var cart = view(cartId);
        if (cart.itens().isEmpty()) {
            throw error(HttpStatus.CONFLICT, "CARRINHO_VAZIO", "Adicione produtos antes de realizar o pedido.");
        }
        for (var item : cart.itens()) {
            if (!"DISPONIVEL".equals(item.situacao())) {
                throw error(HttpStatus.CONFLICT, "ESTOQUE_INSUFICIENTE", "Ajuste os produtos indisponíveis ou sem estoque antes de realizar o pedido.");
            }
            checkStock(item.produtoId(), item.quantidade());
        }
        Long orderId = jdbc.queryForObject("""
                INSERT INTO pedidos(usuario_id, total_centavos) VALUES (?, ?) RETURNING id
                """, Long.class, session.getAttribute("usuarioId"), cart.totalCentavos());
        for (var item : cart.itens()) {
            jdbc.update("""
                    INSERT INTO itens_pedido(pedido_id, produto_id, titulo, quantidade,
                        preco_base_centavos, preco_unitario_centavos, total_centavos)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, orderId, item.produtoId(), item.titulo(), item.quantidade(),
                    item.precoBaseCentavos(), item.precoFinalCentavos(), item.totalCentavos());
        }
        jdbc.update("DELETE FROM itens_carrinho WHERE carrinho_id = ?", cartId);
        jdbc.update("DELETE FROM operacoes_carrinho WHERE carrinho_id = ?", cartId);
        increment(cartId);
        return new Order(orderId, cart.totalCentavos(), view(cartId));
    }

    public AddResult add(HttpSession session, long productId, int quantity, String key) {
        validateQuantity(productId, quantity);
        if (key != null && (key.isBlank() || key.length() > 128)) {
            throw error(HttpStatus.BAD_REQUEST, "CHAVE_INVALIDA", "Idempotency-Key deve conter de 1 a 128 caracteres.");
        }
        var cartId = resolve(session);
        if (key != null) {
            var previous = jdbc.query("SELECT produto_id, quantidade FROM operacoes_carrinho WHERE carrinho_id = ? AND chave = ?",
                    (rs, n) -> new Operation(rs.getLong(1), rs.getInt(2)), cartId, key);
            if (!previous.isEmpty()) {
                var operation = previous.getFirst();
                if (operation.productId() != productId || operation.quantity() != quantity) {
                    throw error(HttpStatus.CONFLICT, "CHAVE_REUTILIZADA", "Esta chave já foi usada com outros dados.");
                }
                return new AddResult(false, view(cartId));
            }
        }
        var existing = jdbc.query("SELECT quantidade FROM itens_carrinho WHERE carrinho_id = ? AND produto_id = ?",
                (rs, n) -> rs.getInt(1), cartId, productId);
        long totalQuantity = (existing.isEmpty() ? 0L : existing.getFirst()) + quantity;
        checkStock(productId, totalQuantity);
        jdbc.update("""
                INSERT INTO itens_carrinho(carrinho_id, produto_id, quantidade) VALUES (?, ?, ?)
                ON CONFLICT(carrinho_id, produto_id) DO UPDATE SET quantidade = EXCLUDED.quantidade
                """, cartId, productId, (int) totalQuantity);
        increment(cartId);
        if (key != null) {
            jdbc.update("INSERT INTO operacoes_carrinho(carrinho_id, chave, produto_id, quantidade) VALUES (?, ?, ?, ?)",
                    cartId, key, productId, quantity);
        }
        return new AddResult(existing.isEmpty(), view(cartId));
    }

    public Cart update(HttpSession session, long productId, int quantity, String version) {
        validateQuantity(productId, quantity);
        var cartId = resolve(session);
        checkVersion(cartId, version);
        var exists = jdbc.queryForObject("SELECT COUNT(*) FROM itens_carrinho WHERE carrinho_id = ? AND produto_id = ?",
                Long.class, cartId, productId);
        if (exists == null || exists == 0) {
            throw error(HttpStatus.NOT_FOUND, "ITEM_NAO_ENCONTRADO", "Item não encontrado no carrinho.");
        }
        checkStock(productId, quantity);
        jdbc.update("UPDATE itens_carrinho SET quantidade = ? WHERE carrinho_id = ? AND produto_id = ?", quantity, cartId, productId);
        increment(cartId);
        return view(cartId);
    }

    public Cart remove(HttpSession session, long productId, String version) {
        if (productId < 1) {
            throw error(HttpStatus.BAD_REQUEST, "ID_INVALIDO", "O ID do produto deve ser positivo.");
        }
        var cartId = resolve(session);
        checkVersion(cartId, version);
        if (jdbc.update("DELETE FROM itens_carrinho WHERE carrinho_id = ? AND produto_id = ?", cartId, productId) > 0) {
            increment(cartId);
        }
        return view(cartId);
    }

    private String resolve(HttpSession session) {
        var userId = (Long) session.getAttribute("usuarioId");
        if (userId != null) {
            // Serializes creation/transfer across every session belonging to this account.
            try {
                jdbc.queryForObject("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", Long.class, userId);
            } catch (EmptyResultDataAccessException exception) {
                session.invalidate();
                throw AuthService.sessaoInvalida();
            }
            var owned = jdbc.query("SELECT id FROM carrinhos WHERE usuario_id = ? FOR UPDATE", (rs, n) -> rs.getString(1), userId);
            if (!owned.isEmpty()) {
                return owned.getFirst();
            }
            var anonymousId = (String) session.getAttribute("carrinhoId");
            if (anonymousId != null) {
                var anonymous = jdbc.query("SELECT id FROM carrinhos WHERE id = ? AND usuario_id IS NULL FOR UPDATE",
                        (rs, n) -> rs.getString(1), anonymousId);
                if (!anonymous.isEmpty()) {
                    jdbc.update("UPDATE carrinhos SET usuario_id = ? WHERE id = ?", userId, anonymousId);
                    return anonymousId;
                }
            }
            String cartId = UUID.randomUUID().toString();
            jdbc.update("INSERT INTO carrinhos(id, usuario_id) VALUES (?, ?)", cartId, userId);
            return cartId;
        }
        String cartId;
        synchronized (session) {
            cartId = (String) session.getAttribute("carrinhoId");
            if (cartId == null) {
                cartId = UUID.randomUUID().toString();
                session.setAttribute("carrinhoId", cartId);
            }
        }
        jdbc.update("INSERT INTO carrinhos(id) VALUES (?) ON CONFLICT(id) DO NOTHING", cartId);
        var anonymous = jdbc.query("SELECT id FROM carrinhos WHERE id = ? AND usuario_id IS NULL FOR UPDATE",
                (rs, n) -> rs.getString(1), cartId);
        if (anonymous.isEmpty()) {
            // Never reuse an account cart after the authentication context disappears.
            session.removeAttribute("carrinhoId");
            return resolve(session);
        }
        return cartId;
    }

    private void checkStock(long productId, long quantity) {
        var stock = jdbc.query("SELECT estoque_disponivel FROM produtos WHERE id = ? FOR SHARE",
                (rs, n) -> rs.getInt(1), productId);
        if (stock.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "PRODUTO_NAO_ENCONTRADO", "Produto não encontrado.");
        }
        if (quantity > stock.getFirst()) {
            throw error(HttpStatus.CONFLICT, "ESTOQUE_INSUFICIENTE", "Quantidade superior ao estoque disponível: " + stock.getFirst() + ".");
        }
    }

    private void checkVersion(String cartId, String expected) {
        if (expected == null || expected.isBlank()) {
            throw error(HttpStatus.PRECONDITION_REQUIRED, "VERSAO_OBRIGATORIA", "Envie o ETag anterior no cabeçalho If-Match.");
        }
        var current = jdbc.queryForObject("SELECT versao FROM carrinhos WHERE id = ?", Long.class, cartId);
        if (!("\"" + current + "\"").equals(expected)) {
            throw error(HttpStatus.PRECONDITION_FAILED, "VERSAO_DIVERGENTE", "O carrinho mudou. Consulte novamente antes de alterar.");
        }
    }

    private void increment(String cartId) {
        jdbc.update("UPDATE carrinhos SET versao = versao + 1 WHERE id = ?", cartId);
    }

    private Cart view(String cartId) {
        var version = jdbc.queryForObject("SELECT versao FROM carrinhos WHERE id = ?", Long.class, cartId);
        var items = jdbc.query("""
                SELECT p.id, p.titulo, p.imagem_url, i.quantidade, p.estoque_disponivel,
                       p.preco_base_centavos, p.desconto_percentual
                FROM itens_carrinho i JOIN produtos p ON p.id = i.produto_id
                WHERE i.carrinho_id = ? ORDER BY p.id
                """, (rs, n) -> {
            int base = rs.getInt("preco_base_centavos");
            int finalPrice = unitPrice(base, rs.getInt("desconto_percentual"));
            int quantity = rs.getInt("quantidade");
            int stock = rs.getInt("estoque_disponivel");
            String status = stock == 0 ? "INDISPONIVEL" : quantity > stock ? "ESTOQUE_INSUFICIENTE" : "DISPONIVEL";
            return new Item(rs.getLong("id"), rs.getString("titulo"), rs.getString("imagem_url"), quantity, stock,
                    base, finalPrice, stock == 0 ? 0 : (long) finalPrice * quantity, status);
        }, cartId);
        long subtotal = items.stream().filter(i -> !i.situacao().equals("INDISPONIVEL"))
                .mapToLong(i -> (long) i.precoBaseCentavos() * i.quantidade()).sum();
        long total = items.stream().mapToLong(Item::totalCentavos).sum();
        return new Cart(cartId, version, "BRL", items, subtotal, subtotal - total, total);
    }

    static int unitPrice(int base, int discount) {
        return (int) (((long) base * (100 - discount) + 50) / 100);
    }

    private void validateQuantity(long productId, int quantity) {
        if (productId < 1 || quantity < 1) {
            throw error(HttpStatus.UNPROCESSABLE_ENTITY, "QUANTIDADE_INVALIDA", "Produto e quantidade devem ser positivos.");
        }
    }

    private ApiException error(HttpStatus status, String code, String message) {
        return new ApiException(status, code, message);
    }

    private record Operation(long productId, int quantity) {}
    public record AddResult(boolean created, Cart cart) {}
    public record Order(long id, long totalCentavos, Cart carrinho) {}
    public record Cart(String id, long versao, String moeda, List<Item> itens,
                       long subtotalCentavos, long descontoCentavos, long totalCentavos) {}
    public record Item(long produtoId, String titulo, String imagemUrl, int quantidade, int estoqueDisponivel,
                       int precoBaseCentavos, int precoFinalCentavos, long totalCentavos, String situacao) {}
}

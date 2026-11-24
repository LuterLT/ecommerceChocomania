package br.com.chocomania.cart;

import br.com.chocomania.common.ApiException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderTest {
    @Test
    void savesAccountOrderWithPriceSnapshotThenClearsCart() {
        var database = new Database();
        var response = new OrderController(new CartService(database.jdbc)).create(database.session, "\"3\"");

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("\"4\"", response.getHeaders().getETag());
        var order = response.getBody();
        assertNotNull(order);
        assertEquals(42L, order.id());
        assertEquals(4821L, order.totalCentavos());
        assertTrue(order.carrinho().itens().isEmpty());
        assertEquals(0L, order.carrinho().totalCentavos());
        assertEquals(7L, database.orderUser);
        var snapshot = database.writes.stream().filter(args -> args[0].toString().contains("INSERT INTO itens_pedido"))
                .findFirst().orElseThrow();
        assertEquals(List.of(42L, 2L, "Chocolate", 3, 1890, 1607, 4821L),
                Arrays.asList(snapshot).subList(1, snapshot.length));
        assertTrue(database.writes.stream().anyMatch(args -> args[0].toString().contains("DELETE FROM operacoes_carrinho")));
    }

    @Test
    void associatesOrderWithAuthenticatedAccount() {
        var database = new Database();
        database.session.setAttribute("usuarioId", 7L);

        new CartService(database.jdbc).checkout(database.session, "\"3\"");

        assertEquals(7L, database.orderUser);
    }

    @Test
    void rejectsGuestWithoutSavingOrClearingCart() {
        var database = new Database();
        database.session.removeAttribute("usuarioId");

        var error = assertThrows(ApiException.class,
                () -> new CartService(database.jdbc).checkout(database.session, "\"3\""));

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
        assertEquals("SESSAO_INVALIDA", error.getCodigo());
        verifyNoInteractions(database.jdbc);
        assertFalse(database.saved);
        assertFalse(database.cleared);
    }

    @Test
    void rejectsEmptyCartWithoutSavingOrder() {
        var database = new Database();
        database.items = List.of();

        var error = assertThrows(ApiException.class,
                () -> new CartService(database.jdbc).checkout(database.session, "\"3\""));

        assertEquals("CARRINHO_VAZIO", error.getCodigo());
        assertFalse(database.saved);
        assertFalse(database.cleared);
    }

    @Test
    void rejectsMissingOrOutdatedCartVersion() {
        for (String version : new String[] {null, "\"2\""}) {
            var database = new Database();
            var error = assertThrows(ApiException.class,
                    () -> new CartService(database.jdbc).checkout(database.session, version));

            assertEquals(version == null ? HttpStatus.PRECONDITION_REQUIRED : HttpStatus.PRECONDITION_FAILED,
                    error.getStatus());
            assertFalse(database.saved);
            assertFalse(database.cleared);
        }
    }

    @Test
    void rejectsInsufficientStockWithoutSavingOrClearing() {
        var database = new Database();
        database.stock = 1;

        var error = assertThrows(ApiException.class,
                () -> new CartService(database.jdbc).checkout(database.session, "\"3\""));

        assertEquals("ESTOQUE_INSUFICIENTE", error.getCodigo());
        assertFalse(database.saved);
        assertFalse(database.cleared);
    }

    @Test
    void rejectsUnavailableItemsWithoutSavingOrClearing() {
        var database = new Database();
        database.items = List.of(new CartService.Item(2L, "Chocolate", "/chocolate.webp", 3, 0,
                1890, 1607, 0L, "INDISPONIVEL"));

        var error = assertThrows(ApiException.class,
                () -> new CartService(database.jdbc).checkout(database.session, "\"3\""));

        assertEquals("ESTOQUE_INSUFICIENTE", error.getCodigo());
        assertFalse(database.saved);
        assertFalse(database.cleared);
    }

    @Test
    void doesNotClearCartWhenSavingItemsFails() {
        var database = new Database();
        database.failItems = true;

        assertThrows(DataAccessResourceFailureException.class,
                () -> new CartService(database.jdbc).checkout(database.session, "\"3\""));

        assertFalse(database.cleared);
        assertEquals(3L, database.version);
    }

    private static class Database {
        final MockHttpSession session = new MockHttpSession();
        final List<Object[]> writes = new ArrayList<>();
        List<CartService.Item> items = List.of(new CartService.Item(2L, "Chocolate", "/chocolate.webp", 3, 10,
                1890, 1607, 4821L, "DISPONIVEL"));
        long version = 3L;
        int stock = 10;
        boolean saved;
        boolean cleared;
        boolean failItems;
        Object orderUser;
        final JdbcTemplate jdbc = mock(JdbcTemplate.class, invocation -> {
            String method = invocation.getMethod().getName();
            Object[] args = invocation.getArguments();
            String sql = args.length == 0 ? "" : args[0].toString();
            if (method.equals("queryForObject")) {
                if (sql.contains("INSERT INTO pedidos")) {
                    saved = true;
                    orderUser = args[2];
                    return 42L;
                }
                return sql.contains("SELECT versao") ? version : 7L;
            }
            if (method.equals("query")) {
                if (sql.contains("FROM itens_carrinho")) return items;
                if (sql.contains("estoque_disponivel FROM produtos")) return List.of(stock);
                return List.of("cart-1");
            }
            if (method.equals("update")) {
                writes.add(args);
                if (sql.contains("INSERT INTO itens_pedido") && failItems) {
                    throw new DataAccessResourceFailureException("database unavailable");
                }
                if (sql.contains("DELETE FROM itens_carrinho")) {
                    cleared = true;
                    items = List.of();
                }
                if (sql.contains("versao = versao + 1")) version++;
                return 1;
            }
            return RETURNS_DEFAULTS.answer(invocation);
        });

        Database() {
            session.setAttribute("usuarioId", 7L);
            session.setAttribute("carrinhoId", "cart-1");
        }
    }
}

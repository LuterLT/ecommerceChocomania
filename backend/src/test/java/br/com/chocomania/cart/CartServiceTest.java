package br.com.chocomania.cart;

import org.junit.jupiter.api.Test;
import br.com.chocomania.common.ApiException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CartServiceTest {
    @Test
    void deletedAccountRevokesOtherSessionAndRejectsCartAccess() {
        var jdbc = mock(JdbcTemplate.class);
        var session = new MockHttpSession();
        session.setAttribute("usuarioId", 7L);
        when(jdbc.queryForObject("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", Long.class, 7L))
                .thenThrow(new EmptyResultDataAccessException(1));

        var error = assertThrows(ApiException.class, () -> new CartService(jdbc).get(session));

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
        assertEquals("SESSAO_INVALIDA", error.getCodigo());
        assertTrue(session.isInvalid());
        verify(jdbc).queryForObject("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", Long.class, 7L);
        verifyNoMoreInteractions(jdbc);
    }

    @Test
    void roundsEachUnitToNearestCentBeforeMultiplyingQuantity() {
        assertEquals(1607, CartService.unitPrice(1890, 15));
        assertEquals(4821L, (long) CartService.unitPrice(1890, 15) * 3);
    }

    @Test
    void preservesFullPriceAndAllowsFullDiscountWithoutOverflow() {
        assertEquals(Integer.MAX_VALUE, CartService.unitPrice(Integer.MAX_VALUE, 0));
        assertEquals(0, CartService.unitPrice(Integer.MAX_VALUE, 100));
    }
}

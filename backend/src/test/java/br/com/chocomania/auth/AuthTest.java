package br.com.chocomania.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import br.com.chocomania.common.ApiException;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.HttpStatus;

class AuthTest {
    @Test
    void exclusaoBloqueiaContaAntesDeRemoverSomenteSeuCarrinhoEUsuario() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(anyString(), any(RowMapper.class), eq(7L))).thenReturn(List.of(7L));

        new AuthService(jdbc).excluir(7L);

        var ordem = inOrder(jdbc);
        ordem.verify(jdbc).query(eq("SELECT id FROM usuarios WHERE id = ? FOR UPDATE"), any(RowMapper.class), eq(7L));
        ordem.verify(jdbc).update("DELETE FROM carrinhos WHERE usuario_id = ?", 7L);
        ordem.verify(jdbc).update("DELETE FROM usuarios WHERE id = ?", 7L);
        ordem.verifyNoMoreInteractions();
    }

    @Test
    void exclusaoDeContaInexistenteNaoRemoveCarrinho() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);

        var erro = assertThrows(ApiException.class, () -> new AuthService(jdbc).excluir(99L));

        assertEquals(HttpStatus.UNAUTHORIZED, erro.getStatus());
        verify(jdbc, never()).update(anyString(), anyLong());
    }

    @Test
    void falhaNaExclusaoPreservaSessaoParaTentarNovamente() {
        AuthService service = mock(AuthService.class);
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("indisponível"))
                .when(service).excluir(7L);
        var request = new MockHttpServletRequest();
        request.getSession().setAttribute("usuarioId", 7L);

        assertThrows(org.springframework.dao.DataAccessResourceFailureException.class,
                () -> new AuthController(service).excluir(request));

        assertEquals(7L, request.getSession(false).getAttribute("usuarioId"));
    }

    @Test
    void atualizacaoNormalizaDadosELimitaAlteracaoAoIdDaSessao() {
        Object[][] argumentos = new Object[1][];
        JdbcTemplate jdbc = mock(JdbcTemplate.class, invocation -> {
            if (invocation.getMethod().getName().equals("query")) {
                argumentos[0] = invocation.getArguments();
                return List.of(new AuthService.Usuario(7L, "Ana Silva", "nova@example.com"));
            }
            return null;
        });

        var usuario = new AuthService(jdbc).atualizar(7L, " Ana Silva ", " NOVA@EXAMPLE.COM ");

        assertEquals("nova@example.com", usuario.email());
        assertEquals("Ana Silva", argumentos[0][2]);
        assertEquals("nova@example.com", argumentos[0][3]);
        assertEquals(7L, argumentos[0][4]);
        String sql = (String) argumentos[0][0];
        assertTrue(sql.contains("WHERE id = ?"));
        assertFalse(sql.contains("senha_hash"));
        assertFalse(sql.contains("data_nascimento"));
    }

    @Test
    void atualizacaoRecusaEmailDuplicado() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class, invocation -> {
            throw new DuplicateKeyException("unique email");
        });
        var erro = assertThrows(ApiException.class,
                () -> new AuthService(jdbc).atualizar(1L, "Ana", "ocupado@example.com"));
        assertEquals(HttpStatus.CONFLICT, erro.getStatus());
        assertEquals("EMAIL_JA_CADASTRADO", erro.getCodigo());
    }

    @Test
    void atualizacaoRecusaUsuarioInexistente() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        var erro = assertThrows(ApiException.class,
                () -> new AuthService(jdbc).atualizar(99L, "Ana", "ana@example.com"));
        assertEquals(HttpStatus.UNAUTHORIZED, erro.getStatus());
    }

    @Test
    void atualizacaoSemSessaoNaoAcessaBancoNemCriaSessao() {
        AuthService service = mock(AuthService.class);
        var request = new MockHttpServletRequest();
        var controller = new AuthController(service);

        var erro = assertThrows(ApiException.class, () -> controller.atualizar(
                new AuthController.Atualizacao("Ana", "ana@example.com"), request));

        assertEquals(HttpStatus.UNAUTHORIZED, erro.getStatus());
        assertNull(request.getSession(false));
        verifyNoInteractions(service);
    }

    @Test
    void atualizacaoUsaSessaoAtualEPreservaCarrinho() {
        AuthService service = mock(AuthService.class);
        var usuario = new AuthService.Usuario(7L, "Ana Silva", "nova@example.com");
        when(service.atualizar(7L, "Ana Silva", "nova@example.com")).thenReturn(usuario);
        var request = new MockHttpServletRequest();
        var sessao = request.getSession();
        sessao.setAttribute("usuarioId", 7L);
        sessao.setAttribute("carrinhoId", "carrinho-original");
        String sessionId = sessao.getId();

        var resposta = new AuthController(service).atualizar(
                new AuthController.Atualizacao("Ana Silva", "nova@example.com"), request);

        assertEquals(usuario, resposta.usuario());
        assertEquals(sessionId, sessao.getId());
        assertEquals("carrinho-original", sessao.getAttribute("carrinhoId"));
        verify(service).atualizar(7L, "Ana Silva", "nova@example.com");
    }

    @Test
    void cadastroNormalizaEmailEArmazenaSomenteHashDaSenha() {
        Object[][] argumentos = new Object[1][];
        JdbcTemplate jdbc = mock(JdbcTemplate.class, invocation -> {
            if (invocation.getMethod().getName().equals("queryForObject")) {
                argumentos[0] = invocation.getArguments();
                return new AuthService.Usuario(1L, "Ana", "ana@example.com");
            }
            return null;
        });
        var usuario = new AuthService(jdbc).cadastrar(" Ana ", " ANA@EXAMPLE.COM ", "Senha@123", null);

        assertEquals("ana@example.com", usuario.email());
        assertEquals("Ana", argumentos[0][2]);
        assertEquals("ana@example.com", argumentos[0][3]);
        String hash = (String) argumentos[0][4];
        assertNotEquals("Senha@123", hash);
        assertTrue(new BCryptPasswordEncoder().matches("Senha@123", hash));
    }

    @Test
    void emailDuplicadoRetornaErroDeConflito() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class, invocation -> {
            throw new DuplicateKeyException("unique email");
        });
        var erro = assertThrows(ApiException.class,
                () -> new AuthService(jdbc).cadastrar("Ana", "ana@example.com", "Senha@123", null));
        assertNotNull(erro);
    }

    @Test
    void emailDesconhecidoNaoAutentica() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(anyString(), any(RowMapper.class), eq("ana@example.com"))).thenReturn(List.of());
        assertThrows(ApiException.class,
                () -> new AuthService(jdbc).autenticar(" ANA@example.com ", "Senha@123"));
    }

    @Test
    void cadastroRecusaSenhaMultibyteQueExcedeLimiteDoBcrypt() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        assertThrows(ApiException.class,
                () -> new AuthService(jdbc).cadastrar("Ana", "ana@example.com", "é".repeat(40), null));
        verifyNoInteractions(jdbc);
    }

    @Test
    void loginRotacionaSessaoEPreservaContextoDoCarrinho() {
        AuthService service = mock(AuthService.class);
        when(service.autenticar("ana@example.com", "Senha@123"))
                .thenReturn(new AuthService.Usuario(1L, "Ana", "ana@example.com"));
        var request = new MockHttpServletRequest();
        var sessao = request.getSession();
        sessao.setAttribute("carrinhoId", "visitante");
        String idAnterior = sessao.getId();

        var resultado = new AuthController(service).entrar(
                new AuthController.Login("ana@example.com", "Senha@123"), request);

        assertNotEquals(idAnterior, sessao.getId());
        assertEquals(1L, sessao.getAttribute("usuarioId"));
        assertEquals("visitante", sessao.getAttribute("carrinhoId"));
        assertEquals(1L, resultado.usuario().id());
    }

    @Test
    void trocarContaRemoveContextoDoCarrinhoAnterior() {
        AuthService service = mock(AuthService.class);
        when(service.autenticar("bia@example.com", "Senha@456"))
                .thenReturn(new AuthService.Usuario(2L, "Bia", "bia@example.com"));
        var request = new MockHttpServletRequest();
        var sessao = request.getSession();
        sessao.setAttribute("usuarioId", 1L);
        sessao.setAttribute("carrinhoId", "visitante-da-conta-anterior");

        new AuthController(service).entrar(
                new AuthController.Login("bia@example.com", "Senha@456"), request);

        assertEquals(2L, sessao.getAttribute("usuarioId"));
        assertNull(sessao.getAttribute("carrinhoId"));
    }

    @Test
    void entrarNovamenteNaMesmaContaPreservaContextoDoCarrinho() {
        AuthService service = mock(AuthService.class);
        when(service.autenticar("ana@example.com", "Senha@123"))
                .thenReturn(new AuthService.Usuario(1L, "Ana", "ana@example.com"));
        var request = new MockHttpServletRequest();
        var sessao = request.getSession();
        sessao.setAttribute("usuarioId", 1L);
        sessao.setAttribute("carrinhoId", "visitante-original");

        new AuthController(service).entrar(
                new AuthController.Login("ana@example.com", "Senha@123"), request);

        assertEquals("visitante-original", sessao.getAttribute("carrinhoId"));
    }

    @Test
    void logoutRevogaSessaoEExpiraCookie() {
        var controller = new AuthController(mock(AuthService.class));
        var request = new MockHttpServletRequest();
        request.getSession().setAttribute("usuarioId", 1L);

        var resposta = controller.sair(request);

        assertEquals(204, resposta.getStatusCode().value());
        assertNull(request.getSession(false));
        assertTrue(resposta.getHeaders().getFirst("Set-Cookie").contains("Max-Age=0"));
        assertThrows(ApiException.class, () -> controller.atual(request));
        assertEquals(204, controller.sair(request).getStatusCode().value());
    }
}

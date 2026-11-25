package br.com.chocomania.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import br.com.chocomania.common.CsrfController;
import br.com.chocomania.common.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {AuthController.class, CsrfController.class},
        properties = "app.cors-origins=http://localhost:5173")
@Import(SecurityConfig.class)
class AccountDeletionHttpTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean AuthService auth;

    @Test
    void exclusaoSemCsrfNaoAcessaServico() throws Exception {
        var session = new MockHttpSession();
        session.setAttribute("usuarioId", 7L);

        mvc.perform(delete("/api/v1/usuarios/me").session(session))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("CSRF_INVALIDO"));

        assertFalse(session.isInvalid());
        verifyNoInteractions(auth);
    }

    @Test
    void exclusaoSemAutenticacaoRetorna401() throws Exception {
        var session = new MockHttpSession();
        var csrf = obterCsrf(session);

        mvc.perform(delete("/api/v1/usuarios/me").session(session).header("X-CSRF-TOKEN", csrf))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo").value("SESSAO_INVALIDA"));

        verifyNoInteractions(auth);
    }

    @Test
    void exclusaoUsaContaDaSessaoERevogaSessaoECookie() throws Exception {
        var session = new MockHttpSession();
        session.setAttribute("usuarioId", 7L);
        session.setAttribute("carrinhoId", "carrinho-atual");
        var csrf = obterCsrf(session);

        mvc.perform(delete("/api/v1/usuarios/me").session(session).header("X-CSRF-TOKEN", csrf))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""))
                .andExpect(cookie().maxAge("JSESSIONID", 0))
                .andExpect(cookie().httpOnly("JSESSIONID", true));

        verify(auth).excluir(7L);
        verifyNoMoreInteractions(auth);
        assertTrue(session.isInvalid());
    }

    private String obterCsrf(MockHttpSession session) throws Exception {
        var response = mvc.perform(get("/api/v1/csrf").session(session))
                .andExpect(status().isOk()).andReturn().getResponse();
        return json.readTree(response.getContentAsString()).get("token").asText();
    }
}

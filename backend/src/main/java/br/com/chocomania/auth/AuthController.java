package br.com.chocomania.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/usuarios")
    public ResponseEntity<Sessao> cadastrar(@Valid @RequestBody Cadastro dados, HttpServletRequest request) {
        var usuario = auth.cadastrar(dados.nomeCompleto(), dados.email(), dados.senha(), dados.dataNascimento());
        iniciarSessao(request, usuario.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(new Sessao(usuario));
    }

    @PostMapping("/sessao")
    public Sessao entrar(@Valid @RequestBody Login dados, HttpServletRequest request) {
        var usuario = auth.autenticar(dados.email(), dados.senha());
        iniciarSessao(request, usuario.id());
        return new Sessao(usuario);
    }

    @GetMapping("/sessao")
    public Sessao atual(HttpServletRequest request) {
        HttpSession sessao = request.getSession(false);
        if (sessao == null || !(sessao.getAttribute("usuarioId") instanceof Long usuarioId)) {
            throw AuthService.sessaoInvalida();
        }
        return new Sessao(auth.obter(usuarioId));
    }

    @PutMapping("/usuarios/me")
    public Sessao atualizar(@Valid @RequestBody Atualizacao dados, HttpServletRequest request) {
        HttpSession sessao = request.getSession(false);
        if (sessao == null || !(sessao.getAttribute("usuarioId") instanceof Long usuarioId)) {
            throw AuthService.sessaoInvalida();
        }
        return new Sessao(auth.atualizar(usuarioId, dados.nomeCompleto(), dados.email()));
    }

    @DeleteMapping("/usuarios/me")
    public ResponseEntity<Void> excluir(HttpServletRequest request) {
        HttpSession sessao = request.getSession(false);
        if (sessao == null || !(sessao.getAttribute("usuarioId") instanceof Long usuarioId)) {
            throw AuthService.sessaoInvalida();
        }
        auth.excluir(usuarioId);
        return sair(request);
    }

    @DeleteMapping("/sessao")
    public ResponseEntity<Void> sair(HttpServletRequest request) {
        HttpSession sessao = request.getSession(false);
        if (sessao != null) {
            sessao.invalidate();
        }
        var cookie = ResponseCookie.from("JSESSIONID", "").httpOnly(true).secure(request.isSecure())
                .sameSite("Lax").path("/").maxAge(0).build();
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
    }

    private static void iniciarSessao(HttpServletRequest request, long usuarioId) {
        HttpSession sessao = request.getSession();
        Object usuarioAnterior = sessao.getAttribute("usuarioId");
        if (usuarioAnterior instanceof Long idAnterior && idAnterior.longValue() != usuarioId) {
            sessao.removeAttribute("carrinhoId");
        }
        request.changeSessionId();
        sessao.setAttribute("usuarioId", usuarioId);
    }

    public record Cadastro(
            @NotBlank @Size(max = 120) String nomeCompleto,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 72) String senha,
            @Past LocalDate dataNascimento) { }

    public record Login(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 72) String senha) { }

    public record Atualizacao(
            @NotBlank @Size(max = 120) String nomeCompleto,
            @NotBlank @Email @Size(max = 254) String email) { }

    public record Sessao(AuthService.Usuario usuario) { }
}

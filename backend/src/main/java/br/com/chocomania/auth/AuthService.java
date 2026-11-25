package br.com.chocomania.auth;

import br.com.chocomania.common.ApiException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder();
    private final String dummyHash = passwords.encode("credencial-inexistente");

    public AuthService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Usuario cadastrar(String nome, String email, String senha, LocalDate dataNascimento) {
        validarSenha(senha);
        try {
            return jdbc.queryForObject("""
                    INSERT INTO usuarios (nome_completo, email, senha_hash, data_nascimento)
                    VALUES (?, ?, ?, ?) RETURNING id, nome_completo, email
                    """, (rs, row) -> new Usuario(rs.getLong("id"), rs.getString("nome_completo"),
                    rs.getString("email")), nome.trim(), normalizarEmail(email), passwords.encode(senha), dataNascimento);
        } catch (DuplicateKeyException exception) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_JA_CADASTRADO", "Este e-mail já está cadastrado.");
        }
    }

    public Usuario autenticar(String email, String senha) {
        List<Credencial> encontradas = jdbc.query("""
                SELECT id, nome_completo, email, senha_hash FROM usuarios WHERE email = ?
                """, (rs, row) -> new Credencial(new Usuario(rs.getLong("id"), rs.getString("nome_completo"),
                rs.getString("email")), rs.getString("senha_hash")), normalizarEmail(email));
        String hash = encontradas.isEmpty() ? dummyHash : encontradas.getFirst().hash();
        boolean confere = senha.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 72
                && passwords.matches(senha, hash);
        if (encontradas.isEmpty() || !confere) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "CREDENCIAIS_INVALIDAS", "E-mail ou senha inválidos.");
        }
        return encontradas.getFirst().usuario();
    }

    public Usuario obter(long id) {
        List<Usuario> usuarios = jdbc.query("SELECT id, nome_completo, email FROM usuarios WHERE id = ?",
                (rs, row) -> new Usuario(rs.getLong("id"), rs.getString("nome_completo"), rs.getString("email")), id);
        if (usuarios.isEmpty()) {
            throw sessaoInvalida();
        }
        return usuarios.getFirst();
    }

    public static ApiException sessaoInvalida() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "SESSAO_INVALIDA", "Entre na sua conta para continuar.");
    }

    public Usuario atualizar(long id, String nome, String email) {
        try {
            List<Usuario> usuarios = jdbc.query("""
                    UPDATE usuarios SET nome_completo = ?, email = ? WHERE id = ?
                    RETURNING id, nome_completo, email
                    """, (rs, row) -> new Usuario(rs.getLong("id"), rs.getString("nome_completo"),
                    rs.getString("email")), nome.trim(), normalizarEmail(email), id);
            if (usuarios.isEmpty()) {
                throw sessaoInvalida();
            }
            return usuarios.getFirst();
        } catch (DuplicateKeyException exception) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_JA_CADASTRADO", "Este e-mail já está cadastrado.");
        }
    }

    @Transactional
    public void excluir(long id) {
        List<Long> usuarios = jdbc.query("SELECT id FROM usuarios WHERE id = ? FOR UPDATE",
                (rs, row) -> rs.getLong("id"), id);
        if (usuarios.isEmpty()) {
            throw sessaoInvalida();
        }
        jdbc.update("DELETE FROM carrinhos WHERE usuario_id = ?", id);
        jdbc.update("DELETE FROM usuarios WHERE id = ?", id);
    }

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static void validarSenha(String senha) {
        if (senha.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "DADOS_INVALIDOS", "A senha deve ter no máximo 72 bytes UTF-8.");
        }
    }

    public record Usuario(long id, String nomeCompleto, String email) { }
    private record Credencial(Usuario usuario, String hash) { }
}

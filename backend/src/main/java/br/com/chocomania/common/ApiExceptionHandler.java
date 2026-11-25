package br.com.chocomania.common;

import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger LOG = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> domain(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(error(ex.getCodigo(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> campos.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.unprocessableEntity().body(Map.of("codigo", "DADOS_INVALIDOS", "mensagem", "Revise os campos informados.", "campos", campos));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class, ConstraintViolationException.class})
    ResponseEntity<?> malformed(Exception ex) {
        return ResponseEntity.badRequest().body(error("REQUISICAO_INVALIDA", "JSON ou parâmetro inválido."));
    }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<?> database(DataAccessException ex) {
        LOG.error("Falha no acesso ao banco: {}", ex.getClass().getSimpleName());
        return ResponseEntity.status(503).body(error("SERVICO_INDISPONIVEL", "Serviço temporariamente indisponível."));
    }

    private Map<String, String> error(String codigo, String mensagem) {
        return Map.of("codigo", codigo, "mensagem", mensagem);
    }
}

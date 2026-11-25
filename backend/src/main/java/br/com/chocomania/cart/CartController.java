package br.com.chocomania.cart;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/carrinho")
public class CartController {
    private final CartService service;

    public CartController(CartService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<CartService.Cart> get(HttpSession session) {
        return response(200, service.get(session));
    }

    @PostMapping("/itens")
    public ResponseEntity<CartService.Cart> add(HttpSession session,
            @Valid @RequestBody AddItem request,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        var result = service.add(session, request.produtoId(), request.quantidade(), key);
        return response(result.created() ? 201 : 200, result.cart());
    }

    @PatchMapping("/itens/{produtoId}")
    public ResponseEntity<CartService.Cart> update(HttpSession session,
            @PathVariable long produtoId, @Valid @RequestBody UpdateItem request,
            @RequestHeader(value = "If-Match", required = false) String version) {
        return response(200, service.update(session, produtoId, request.quantidade(), version));
    }

    @DeleteMapping("/itens/{produtoId}")
    public ResponseEntity<CartService.Cart> remove(HttpSession session,
            @PathVariable long produtoId,
            @RequestHeader(value = "If-Match", required = false) String version) {
        return response(200, service.remove(session, produtoId, version));
    }

    private ResponseEntity<CartService.Cart> response(int status, CartService.Cart cart) {
        return ResponseEntity.status(status).eTag("\"" + cart.versao() + "\"").body(cart);
    }

    public record AddItem(@Positive long produtoId, @Positive int quantidade) {}
    public record UpdateItem(@Positive int quantidade) {}
}

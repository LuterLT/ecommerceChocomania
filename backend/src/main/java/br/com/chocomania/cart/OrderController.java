package br.com.chocomania.cart;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pedidos")
public class OrderController {
    private final CartService service;

    public OrderController(CartService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CartService.Order> create(HttpSession session,
            @RequestHeader(value = "If-Match", required = false) String version) {
        var order = service.checkout(session, version);
        return ResponseEntity.status(201).eTag("\"" + order.carrinho().versao() + "\"").body(order);
    }
}

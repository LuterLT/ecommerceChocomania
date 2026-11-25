package br.com.chocomania.catalog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/categorias")
    public Map<String, List<CatalogService.CategoriaDto>> categorias() {
        return Map.of("itens", catalog.categorias());
    }

    @GetMapping("/produtos")
    public CatalogService.PaginaDto<CatalogService.ProdutoResumoDto> produtos(
            @RequestParam(name = "categoriaId", required = false) Long categoriaId,
            @RequestParam(name = "busca", required = false) String busca,
            @RequestParam(name = "pagina", defaultValue = "1") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {
        return catalog.produtos(categoriaId, busca, pagina, tamanho);
    }

    @GetMapping("/produtos/{produtoId}")
    public CatalogService.ProdutoDetalheDto produto(@PathVariable("produtoId") long produtoId) {
        return catalog.produto(produtoId);
    }
}

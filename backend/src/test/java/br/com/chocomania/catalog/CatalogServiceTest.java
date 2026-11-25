package br.com.chocomania.catalog;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CatalogServiceTest {
    @Test
    void arredondaDescontoPorUnidadeParaOCentavoMaisProximo() {
        // R$ 18,90 com 15% de desconto resulta em R$ 16,065 antes do arredondamento.
        assertEquals(1607, CatalogService.precoFinal(1890, 15));
        assertEquals(1290, CatalogService.precoFinal(1290, 0));
        assertEquals(0, CatalogService.precoFinal(1290, 100));
        assertEquals(0, CatalogService.precoFinal(0, 15));
    }

    @Test
    void calculaSemOverflowParaPrecosGrandes() {
        assertEquals(Integer.MAX_VALUE, CatalogService.precoFinal(Integer.MAX_VALUE, 0));
        assertEquals(1_825_361_100, CatalogService.precoFinal(Integer.MAX_VALUE, 15));
    }
}

import { Http } from '../http.js';

export const CatalogoService = {
  /** Catálogo completo de productos (para el selector al publicar un lote). */
  getCatalogo() {
    return Http.get('catalogo.php');
  },

  /**
   * Búsqueda parcial por nombre (autocomplete al publicar un lote).
   * @param {string} texto
   */
  buscar(texto) {
    return Http.get('catalogo.php', { q: texto });
  },

  /** Categorías de productos para selectores y filtros. */
  getCategorias() {
    return Http.get('catalogo.php', { categorias: 1 });
  },
};

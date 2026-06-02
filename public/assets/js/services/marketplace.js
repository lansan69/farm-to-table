import { Http } from '../http.js';

export const MarketplaceService = {
  /** Categorías para los botones de filtro de la pantalla principal. */
  getCategorias() {
    return Http.get('marketplace.php', { categorias: 1 });
  },

  /**
   * Listado de lotes disponibles con filtros opcionales.
   * @param {{ nombre?, categoria?, zona? }} filtros
   */
  getLotes({ nombre, categoria, zona } = {}) {
    const params = {};
    if (nombre)    params.nombre    = nombre;
    if (categoria) params.categoria = categoria;
    if (zona)      params.zona      = zona;
    return Http.get('marketplace.php', params);
  },

  /**
   * Detalle completo de un lote (datos + fotos).
   * @param {number} id
   */
  getDetalleLote(id) {
    return Http.get('marketplace.php', { id });
  },
};

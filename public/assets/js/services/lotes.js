import { Http } from '../http.js';

export const LotesService = {
  /**
   * Lotes publicados por un productor (panel del productor).
   * @param {number} idProductor
   */
  getLotesProductor(idProductor) {
    return Http.get('lotes.php', { id_productor: idProductor });
  },

  /**
   * Detalle completo de un lote (datos + fotos + trazabilidad).
   * @param {number} idLote
   */
  getDetalleLote(idLote) {
    return Http.get('lotes.php', { id_lote: idLote });
  },

  /** Lotes con 0–3 días de vida útil restantes. */
  getLotesUrgentes() {
    return Http.get('lotes.php', { urgentes: 1 });
  },

  /**
   * Publica un nuevo lote.
   * @param {{ id_productor, id_producto, cantidad, fecha_cosecha, precio, fotos? }} datos
   * @returns {Promise<{ id_lote: number }>}
   */
  publicar({ id_productor, id_producto, cantidad, fecha_cosecha, precio, fotos = [] }) {
    return Http.post('lotes.php', {
      id_productor,
      id_producto,
      cantidad,
      fecha_cosecha,
      precio,
      fotos,
    });
  },

  /**
   * Cambia el estado de un lote (solo el productor dueño del lote).
   * @param {number} idLote
   * @param {number} idProductor
   * @param {'disponible'|'asignado'|'entregado'|'vencido'} estado
   */
  cambiarEstado(idLote, idProductor, estado) {
    return Http.patch('lotes.php', { id_lote: idLote, id_productor: idProductor, estado });
  },
};

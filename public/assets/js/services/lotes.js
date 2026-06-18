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

subirLote(formData) {
    // Se envía directamente el FormData.
    // Importante: tu clase Http.post NO debe hacer JSON.stringify si detecta que es un FormData
    return Http.post('lotes.php?action=publicar', formData);
  },
  
actualizarLote(formData) {
    // Se envía directamente el FormData.
    // Importante: tu clase Http.post NO debe hacer JSON.stringify si detecta que es un FormData
    return Http.post('lotes.php?action=editar', formData);
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

  /**
   * Actualiza precio y/o estado de un lote (uso exclusivo del admin).
   * @param {number} idLote
   * @param {{ precio?: number, estado?: string }} datos
   */
  actualizar(idLote, datos) {
    return Http.patch('lotes.php', { id_lote: idLote, ...datos });
  },

  /**
   * Elimina un lote (uso exclusivo del admin).
   * @param {number} idLote
   */
  eliminar(idLote) {
    return Http.delete('lotes.php', { id_lote: idLote });
  },
};

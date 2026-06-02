import { Http } from '../http.js';

export const EntregasService = {
  /**
   * Entrega asociada a una negociación.
   * @param {number} idNegociacion
   */
  getByNegociacion(idNegociacion) {
    return Http.get('entregas.php', { id_negociacion: idNegociacion });
  },

  /**
   * Busca una entrega por su código QR (antes de confirmar).
   * @param {string} codigoQR
   */
  getByQR(codigoQR) {
    return Http.get('entregas.php', { qr: codigoQR });
  },

  /**
   * El comprador confirma la recepción escaneando el QR.
   * @param {string} codigoQR
   * @returns {Promise<{ id_entrega: number }>}
   */
  confirmar(codigoQR) {
    return Http.post('entregas.php', { action: 'confirmar', codigo_qr: codigoQR });
  },

  /**
   * Actualiza el estado logístico de una entrega (productor/admin).
   * @param {number} idEntrega
   * @param {'pendiente'|'en_camino'|'entregado'} estado
   */
  actualizarEstado(idEntrega, estado) {
    return Http.patch('entregas.php', { action: 'estado', id_entrega: idEntrega, estado });
  },
};

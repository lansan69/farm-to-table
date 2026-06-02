import { Http } from '../http.js';

export const NegociacionesService = {
  /** Negociaciones activas donde el usuario es comprador. */
  getByComprador(idComprador) {
    return Http.get('negociaciones.php', { id_comprador: idComprador });
  },

  /** Negociaciones activas donde el usuario es productor. */
  getByProductor(idProductor) {
    return Http.get('negociaciones.php', { id_productor: idProductor });
  },

  /** Hilo completo de ofertas de una negociación. */
  getHilo(idNegociacion) {
    return Http.get('negociaciones.php', { hilo: idNegociacion });
  },

  /** Historial completo de compras de un comprador. */
  getHistorialComprador(idComprador) {
    return Http.get('negociaciones.php', { historial_comprador: idComprador });
  },

  /** Historial completo de ventas de un productor. */
  getHistorialProductor(idProductor) {
    return Http.get('negociaciones.php', { historial_productor: idProductor });
  },

  /**
   * Inicia una nueva negociación con la primera oferta.
   * @param {{ id_lote, id_comprador, monto, comentario? }} datos
   * @returns {Promise<{ id_negociacion: number }>}
   */
  iniciar({ id_lote, id_comprador, monto, comentario = null }) {
    const body = { action: 'iniciar', id_lote, id_comprador, monto };
    if (comentario) body.comentario = comentario;
    return Http.post('negociaciones.php', body);
  },

  /**
   * Envía una contraoferta en una negociación en curso.
   * @param {{ id_negociacion, id_emisor, monto, comentario? }} datos
   */
  contraoferta({ id_negociacion, id_emisor, monto, comentario = null }) {
    const body = { action: 'contraoferta', id_negociacion, id_emisor, monto };
    if (comentario) body.comentario = comentario;
    return Http.post('negociaciones.php', body);
  },

  /** Acepta la última oferta de una negociación. */
  aceptar(idNegociacion) {
    return Http.patch('negociaciones.php', { action: 'aceptar', id_negociacion: idNegociacion });
  },

  /** Rechaza y cierra una negociación. */
  rechazar(idNegociacion) {
    return Http.patch('negociaciones.php', { action: 'rechazar', id_negociacion: idNegociacion });
  },
};

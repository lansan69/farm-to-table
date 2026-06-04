import { Http } from '../http.js';

export const FavoritosService = {
  /**
   * Lotes marcados como favoritos por un usuario.
   * @param {number} idUsuario
   */
  getFavoritos(idUsuario) {
    return Http.get('favoritos.php', { id_usuario: idUsuario });
  },

  /**
   * Agrega o elimina un favorito (toggle).
   * @param {number} idUsuario
   * @param {number} idLote
   * @returns {Promise<{ accion: 'agregado' | 'eliminado', id_lote: number }>}
   */
  toggleFavorito(idUsuario, idLote) {
    return Http.post('favoritos.php', { id_usuario: idUsuario, id_lote: idLote });
  },
};

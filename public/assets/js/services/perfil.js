import { Http } from '../http.js';

export const PerfilService = {
  /**
   * Perfil del comprador: datos personales + stats + valoraciones recibidas.
   * @param {number} idUsuario
   */
  getPerfilComprador(idUsuario) {
    return Http.get('perfil.php', { id_usuario: idUsuario, rol: 'comprador' });
  },

  /**
   * Perfil del productor: datos personales + stats + valoraciones recibidas.
   * @param {number} idUsuario
   */
  getPerfilProductor(idUsuario) {
    return Http.get('perfil.php', { id_usuario: idUsuario, rol: 'productor' });
  },

  /**
   * Actualiza los datos editables del perfil.
   * @param {{ id_usuario, nombre, telefono, id_zona, email? }} datos
   */
  update({ id_usuario, nombre, telefono, id_zona, email = null }) {
    const body = { id_usuario, nombre, telefono, id_zona };
    if (email) body.email = email;
    return Http.put('perfil.php', body);
  },

  /**
   * Registra una valoración al finalizar una entrega.
   * @param {{ id_entrega, id_evaluador, id_evaluado, estrellas, comentarios? }} datos
   * @returns {Promise<{ id_valoracion: number }>}
   */
  registrarValoracion({ id_entrega, id_evaluador, id_evaluado, estrellas, comentarios = null }) {
    const body = { action: 'valoracion', id_entrega, id_evaluador, id_evaluado, estrellas };
    if (comentarios) body.comentarios = comentarios;
    return Http.post('perfil.php', body);
  },
};

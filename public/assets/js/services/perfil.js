import { Http } from '../http.js';

export const PerfilService = {
  getPerfilComprador(idUsuario) {
    return Http.get('perfil.php', { id_usuario: idUsuario, rol: 'comprador' });
  },

  getPerfilProductor(idUsuario) {
    return Http.get('perfil.php', { id_usuario: idUsuario, rol: 'productor' });
  },

  getZonas() {
    return Http.get('perfil.php', { action: 'zonas' });
  },

  update({ id_usuario, nombre, apellido = null, telefono, id_zona, email = null }) {
    const body = { id_usuario, nombre, telefono, id_zona };
    if (apellido !== null && apellido !== '') body.apellido = apellido;
    if (email)    body.email    = email;
    return Http.put('perfil.php', body);
  },

  updatePassword({ id_usuario, password }) {
    return Http.put('perfil.php', { action: 'password', id_usuario, password });
  },

  registrarValoracion({ id_entrega, id_evaluador, id_evaluado, estrellas, comentarios = null }) {
    const body = { action: 'valoracion', id_entrega, id_evaluador, id_evaluado, estrellas };
    if (comentarios) body.comentarios = comentarios;
    return Http.post('perfil.php', body);
  },
};

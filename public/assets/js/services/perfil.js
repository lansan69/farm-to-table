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

  update({ id_usuario, nombre, apellido = null, telefono, id_zona, email = null, foto = null }) {
    const formData = new FormData();
    
    // Agregamos un flag 'action' para que tu backend sepa que es un update en caso de que 
    // estés usando el mismo endpoint (POST) para crear y actualizar.
    formData.append('action', 'update');
    formData.append('id_usuario', id_usuario);
    formData.append('nombre', nombre);
    formData.append('telefono', telefono);
    formData.append('id_zona', id_zona);

    if (apellido !== null && apellido !== '') {
      formData.append('apellido', apellido);
    }
    if (email) {
      formData.append('email', email);
    }
    if (foto) {
      formData.append('foto', foto);
    }

    return Http.post('perfil.php', formData);
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
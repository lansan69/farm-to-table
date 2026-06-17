import { Http } from '../http.js';

export const UsuariosService = {
  /**
   * Recupera todos los usuarios, con filtros opcionales acumulables.
   * @param {{ nombre?: string, correo?: string, rol?: string }} filtros
   */
  getUsuarios({ nombre, correo, rol } = {}) {
    const params = {};
    if (nombre) params.nombre = nombre;
    if (correo) params.correo = correo;
    if (rol)    params.rol    = rol;
    return Http.get('usuarios.php', params);
  },

  /**
   * Datos públicos de un usuario por ID.
   * @param {number} id
   */
  getById(id) {
    return Http.get('usuarios.php', { id });
  },

getReportes(search_term, id_reporta, id_reportado, fecha) {
  const params = {};
  
  if (search_term) params.search_term = search_term; 
  if (id_reporta) params.id_reporta = id_reporta;
  if (id_reportado) params.id_reportado = id_reportado;
  if (fecha) params.fecha = fecha;

  return Http.get('reportes.php', params);
}
};

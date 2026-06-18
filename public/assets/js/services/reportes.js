import { Http } from '../http.js';

export const ReportesService = {
  /**
   * Recupera el historial completo de reportes con filtros opcionales.
   * @param {{ search_term?: string, id_reporta?: number, id_reportado?: number, fecha?: string }} filtros
   */
  getReportes({ search_term, id_reporta, id_reportado, fecha } = {}) {
    const params = {};
    
    if (search_term) params.search_term = search_term; 
    if (id_reporta)  params.id_reporta = id_reporta;
    if (id_reportado) params.id_reportado = id_reportado;
    if (fecha)       params.fecha = fecha;

    return Http.get('reportes.php', params);
  },

  /**
   * Envía un nuevo reporte de usuario al servidor.
   * @param {{ id_usuario_reporta: number, id_usuario_reportado: number, situacion: string, chat_id?: number|null }} datos
   */
  reportarUsuario({ id_usuario_reporta, id_usuario_reportado, situacion, chat_id = null }) {
    const formData = new FormData();
    
    formData.append('id_usuario_reporta', id_usuario_reporta);
    formData.append('id_usuario_reportado', id_usuario_reportado);
    formData.append('situacion', situacion.trim());
    
    if (chat_id !== null && chat_id !== undefined) {
      formData.append('chat_id', chat_id);
    }

    return Http.post('reportes.php', formData);
  }
};
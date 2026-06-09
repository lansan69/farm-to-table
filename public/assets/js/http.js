// Wrapper de fetch() para los endpoints de src/api/.
// Todas las pantallas consumen la API a través de este módulo — nunca llamen
// a fetch() directamente desde un componente.
//
// Uso:
//   import { Http } from '../../../../assets/js/http.js';
//
//   const lotes    = await Http.get('marketplace.php');
//   const lote     = await Http.get('marketplace.php', { id: 5 });
//   const result   = await Http.post('auth.php', { action: 'login', ... });
//   const result   = await Http.patch('lotes.php', { id_lote: 1, estado: 'asignado' });
//   const result   = await Http.put('perfil.php', { id_usuario: 3, ... });

const API_BASE = '/src/api';

// ── HttpError ─────────────────────────────────────────────────────────────────
// Error enriquecido con el código HTTP y el mensaje que devolvió el servidor.
// Los componentes pueden hacer: catch (e) { if (e instanceof HttpError) ... }

export class HttpError extends Error {
  constructor(message, httpStatus) {
    super(message);
    this.name       = 'HttpError';
    this.httpStatus = httpStatus;
  }
}

// ── request() ────────────────────────────────────────────────────────────────
// Función interna — no exportada. Ejecuta el fetch, parsea el JSON y desempaca
// el campo `data` del envelope { status, data } o lanza HttpError si hay error.

async function request(endpoint, method = 'GET', body = null) {
  const init = { method };

  if (body !== null) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body    = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}/${endpoint}`, init);
  } catch {
    throw new HttpError('Sin conexión con el servidor.', 0);
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw new HttpError(`Respuesta inesperada del servidor (${res.status}).`, res.status);
  }

  if (json.status === 'error') {
    throw new HttpError(json.message ?? 'Error desconocido.', res.status);
  }

  return json.data;
}

// ── Http ──────────────────────────────────────────────────────────────────────

export const Http = {
  /**
   * GET request. Los parámetros de query se pasan como objeto:
   *   Http.get('marketplace.php', { nombre: 'tomate', zona: 1 })
   * También acepta inline: Http.get('marketplace.php?categorias=1')
   */
  get(endpoint, params = {}) {
    const qs  = new URLSearchParams(params).toString();
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = qs ? `${endpoint}${sep}${qs}` : endpoint;
    return request(url, 'GET');
  },

  /** POST — el body se serializa a JSON automáticamente. */
  post(endpoint, body) {
    return request(endpoint, 'POST', body);
  },

  /** PATCH — para actualizaciones parciales (estado de lote, negociación, etc.). */
  patch(endpoint, body) {
    return request(endpoint, 'PATCH', body);
  },

  /** PUT — para actualizaciones completas (perfil de usuario). */
  put(endpoint, body) {
    return request(endpoint, 'PUT', body);
  },

  /** DELETE — poco usado en este proyecto, incluido por completitud. */
  delete(endpoint, body = null) {
    return request(endpoint, 'DELETE', body);
  },
};

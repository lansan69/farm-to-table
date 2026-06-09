import { Http } from '../http.js';

export const AuthService = {
  /** Zonas activas para el selector del formulario de registro. */
  getZonas() {
    return Http.get('auth.php', { zonas: 1 });
  },

  /**
   * Login por teléfono o email.
   * @param {string} identificador  Teléfono o dirección de email
   * @param {string} contrasena
   * @returns {Promise<{id_usuario, nombre, rol, telefono, email, zona}>}
   */
  login(identificador, contrasena) {
    return Http.post('auth.php', { action: 'login', identificador, contrasena });
  },

  /**
   * Registro de nuevo usuario.
   * @param {{ id_zona, nombre, rol, telefono, contrasena, email? }} datos
   * @returns {Promise<{ id_usuario: number }>}
   */
  loginGoogle(idToken) {
    return Http.post('auth.php', { action: 'login_google', id_token: idToken });
  },

  register({ id_zona, nombre, apellido = null, rol, telefono, contrasena, email = null }) {
    const body = { action: 'register', id_zona, nombre, rol, telefono, contrasena };
    if (email)    body.email    = email;
    if (apellido) body.apellido = apellido;
    return Http.post('auth.php', body);
  },

  registerGoogle({ id_token, id_zona, telefono, rol, apellido = null }) {
    const body = { action: 'register_google', id_token, id_zona, telefono, rol };
    if (apellido) body.apellido = apellido;
    return Http.post('auth.php', body);
  },
};

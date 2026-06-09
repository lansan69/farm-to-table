import { AuthService }               from '../../../../../assets/js/services/auth.js';
import { navigate }                  from '../../../../../assets/js/app.js';
import { toastSuccess, toastError }  from '../../../../../assets/js/toast.js';

/**
 * Módulo de autenticación de la interfaz: gestiona los eventos del formulario
 * de login y registro dentro del contenedor proporcionado.
 * Exporta la función init(container) que conecta los listeners necesarios.
 */
export function init(container) {
    if (container._authInit) return;
    container._authInit = true;

    // Referencia al contenedor que cambia entre vista de login y registro
    const wrapper = container.querySelector('#authWrapper');

    // ___________ Mostrar fromulario de registro_______________________________
    container.querySelector('#btnShowRegister')
        .addEventListener('click', () => wrapper.classList.add('show-register'));

    // ___________ Volver al formulario de login ________________________________
    container.querySelector('#btnShowLogin')
        .addEventListener('click', () => wrapper.classList.remove('show-register'));

    // ___________ Mostrar / ocultar contraseña ________________________________
    container.querySelectorAll('.eye-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // input correspondiente al botón ojo (elemento anterior en DOM)
            const input = btn.previousElementSibling;
            // comprobamos si actualmente está oculto (tipo password)
            const isHidden = input.type === 'password';
            // alternamos entre 'text' y 'password' para mostrar/ocultar
            input.type = isHidden ? 'text' : 'password';
            // cambiamos el color del icono para dar feedback visual
            btn.style.color = isHidden ? 'var(--green)' : 'var(--muted)';
        });
    });

    // ___________ Submit formulario de login __________________________________
    container.querySelector('#loginForm')
        .addEventListener('submit', async (e) => {
            // Previene el comportamiento por defecto (recarga/envío)
            e.preventDefault();
            // Recogida y normalización de valores del formulario
            const email    = container.querySelector('#login-email').value.trim();
            const password = container.querySelector('#login-password').value;
            // Validación básica: si falta email o contraseña se llama a shake()
            // para indicar visualmente el error sobre el campo de email.
            if (!email || !password) return shake(container, 'login-email');

            const btn          = container.querySelector('#loginForm .btn-primary');
            const originalText = btn.textContent;
            btn.disabled  = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';

            try {
                await AuthService.login(email, password);
                localStorage.setItem("token", email);
                toastSuccess('Bienvenido!!!');
                navigate('/usuario/marketplace');
            } catch (err) {
                const isWrongPassword = err.httpStatus === 401;
                shake(container, isWrongPassword ? 'login-password' : 'login-email');
                toastError(isWrongPassword ? 'Contraseña incorrecta.' : 'No existe una cuenta con ese correo.');
                btn.disabled    = false;
                btn.textContent = originalText;
            }
        });

    // ___________ Submit formulario de registro _______________________________
    container.querySelector('.register-form .btn-primary')
        .addEventListener('click', () => {
            // Lectura de campos del formulario de registro
            const name     = container.querySelector('#reg-name').value.trim();
            const phone    = container.querySelector('#reg-phone').value.trim();
            const email    = container.querySelector('#reg-email').value.trim();
            const password = container.querySelector('#reg-password').value;
            const confirm  = container.querySelector('#reg-confirm').value;
            // rol seleccionado (se asume que hay un input radio seleccionado)
            const role     = container.querySelector('input[name="role"]:checked').value;

            // Validaciones: nombre, email y password obligatorios; confirmación de
            // contraseña debe coincidir. En caso de fallo se invoca shake() sobre
            // el campo correspondiente para dar feedback visual.
            if (!name || !email || !password) return shake(container, 'reg-name');
            if (password !== confirm) return shake(container, 'reg-confirm');
            // Aquí debería invocarse AuthService.register({ name, phone, email, password, role })
            console.log('Register:', { name, phone, email, password, role });
        });
}

/**
 * Función utilitaria para hacer un efecto visual de 'temblor' (shake) sobre un
 * input específico dentro del contenedor. Se usa para indicar errores de
 * validación al usuario (por ejemplo campo obligatorio vacío o mismatch).
 *
 * @param {HTMLElement} container - contenedor raíz donde buscar el input
 * @param {string} inputId - id del elemento input al que aplicar el efecto
 */
function shake(container, inputId) {
    const el = container.querySelector(`#${inputId}`);
    // Si no existe el elemento, salir silenciosamente
    if (!el) return;
    // Marcamos el borde en rojo para resaltar el error
    el.style.borderColor = '#e53935';
    // Animación de traslación horizontal para simular 'temblor'
    el.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' },
    ], { duration: 320, easing: 'ease' });
    // Restauramos el color del borde pasados 1.2s para no dejar el estilo fijo
    setTimeout(() => el.style.borderColor = '', 1200);
}

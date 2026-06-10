import { AuthService } from '../../../../../assets/js/services/auth.js';
import { navigate } from '../../../../../assets/js/app.js';
import { toastSuccess, toastError, toastWelcome } from '../../../../../assets/js/toast.js';
import { initGoogleSignIn, renderGoogleButton, renderGoogleIconButton } from '../../../../../assets/js/google.js';

let _inited = false;

export function cleanup() {
    _inited = false;
    window.google?.accounts?.id?.cancel?.();
}

export function init(container) {
    if (_inited) return;
    _inited = true;

    const wrapper = container.querySelector('#authWrapper');
    const btn = container.querySelector('#loginForm .btn-primary');
    const originalText = btn.textContent;

    // ___________ Load zonas into register select _____________________________
    (async () => {
        try {
            const zonas = await AuthService.getZonas();
            const select = container.querySelector('#reg-zona');
            zonas.forEach(z => {
                const opt = document.createElement('option');
                opt.value = z.id_zona;
                opt.textContent = z.nombre_delegacion;
                select.appendChild(opt);
            });
        } catch (err) {
            console.error('No se pudieron cargar las zonas:', err);
        }
    })();

    // ___________ Google Sign-In ______________________________________________
    (async () => {
        await initGoogleSignIn(async (idToken) => {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';
            if (wrapper.classList.contains('show-register')) {
                await handleGoogleRegister(container, idToken, btn, originalText);
            } else {
                try {
                    const user = await AuthService.loginGoogle(idToken);
                    localStorage.setItem('token', user.id_usuario);
                    toastWelcome({ title: `Bienvenido ${user.nombre_razon_social}!`, body: "Explora productos" });
                    navigateByRole(user.rol_usuario);
                } catch (err) {
                    btn.disabled = false;
                    btn.textContent = originalText;
                    toastError(err.message || 'Error al iniciar sesión con Google.');
                }
            }
        });
        renderGoogleButton(container.querySelector('#google-btn-login'));
        renderGoogleButton(container.querySelector('#google-btn-register'));
        renderGoogleIconButton(container.querySelector('#google-btn-login-icon'));
        renderGoogleIconButton(container.querySelector('#google-btn-register-icon'));
    })().catch((err) => {
        console.error('Google Sign-In init failed:', err);
    });

    // ___________ Teléfono: solo dígitos, máx 10 _____________________________
    container.querySelector('#reg-phone').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });

    // ___________ Mostrar formulario de registro ______________________________
    container.querySelector('#btnShowRegister')
        .addEventListener('click', () => wrapper.classList.add('show-register'));

    // ___________ Volver al formulario de login _______________________________
    container.querySelector('#btnShowLogin')
        .addEventListener('click', () => {
            wrapper.classList.remove('show-register');
            resetRegisterForm(container);
        });

    // ___________ Mobile CTAs (text links below each form) ____________________
    container.querySelector('#btnShowRegisterMobile')
        .addEventListener('click', () => wrapper.classList.add('show-register'));

    container.querySelector('#btnShowLoginMobile')
        .addEventListener('click', () => {
            wrapper.classList.remove('show-register');
            resetRegisterForm(container);
        });

    // ___________ Mostrar / ocultar contraseña ________________________________
    container.querySelectorAll('.eye-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.style.color = isHidden ? 'var(--green)' : 'var(--muted)';
        });
    });

    // ___________ Submit formulario de login __________________________________
    container.querySelector('#loginForm')
        .addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = container.querySelector('#login-email').value.trim();
            const password = container.querySelector('#login-password').value;
            if (!email || !password) return shake(container, 'login-email');

            const btn = container.querySelector('#loginForm .btn-primary');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';

            try {
                const user = await AuthService.login(email, password);
                localStorage.setItem('token', user.id_usuario);
                toastWelcome({ title: `Bienvenido ${user.nombre_razon_social}!`, body: "Explora productos" }); navigateByRole(user.rol_usuario);
            } catch (err) {
                const isWrongPassword = err.httpStatus === 401;
                shake(container, isWrongPassword ? 'login-password' : 'login-email');
                toastError(isWrongPassword ? 'Contraseña incorrecta.' : 'No existe una cuenta con ese correo.');
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });

    // ___________ Submit formulario de registro _______________________________
    container.querySelector('#registerForm')
        .addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = container.querySelector('#reg-name').value.trim();
            const lastname = container.querySelector('#reg-lastname').value.trim();
            const phone = container.querySelector('#reg-phone').value.trim();
            const email = container.querySelector('#reg-email').value.trim();
            const zonaId = container.querySelector('#reg-zona').value;
            const password = container.querySelector('#reg-password').value;
            const confirm = container.querySelector('#reg-confirm').value;
            const role = container.querySelector('input[name="role"]:checked').value;
            const googleToken = container.querySelector('#reg-google-token').value;

            if (!name) return shake(container, 'reg-name');
            if (phone.length !== 10) return shake(container, 'reg-phone');
            if (!zonaId) return shake(container, 'reg-zona');

            const btn = container.querySelector('#registerForm .btn-primary');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando...';

            try {
                if (googleToken) {
                    const user = await AuthService.registerGoogle({
                        id_token: googleToken,
                        id_zona: parseInt(zonaId),
                        telefono: phone,
                        rol: role,
                        apellido: lastname,
                    });
                    localStorage.setItem('token', user.id_usuario);
                    toastWelcome({ title: `Bienvenido ${user.nombre_razon_social}!`, body: "Explora productos" });
                    navigateByRole(user.rol_usuario);
                } else {
                    if (!email) return restoreBtn(btn, originalText, () => shake(container, 'reg-email'));
                    if (!password) return restoreBtn(btn, originalText, () => shake(container, 'reg-password'));
                    if (password !== confirm) return restoreBtn(btn, originalText, () => shake(container, 'reg-confirm'));

                    await AuthService.register({
                        id_zona: parseInt(zonaId),
                        nombre: name,
                        apellido: lastname,
                        rol: role,
                        telefono: phone,
                        contrasena: password,
                        email: email || null,
                    });
                    toastSuccess('Cuenta creada. ¡Inicia sesión!');
                    wrapper.classList.remove('show-register');
                    resetRegisterForm(container);
                }
            } catch (err) {
                toastError(err.message || 'Error al crear la cuenta.');
                const fieldByMessage = {
                    'El número de teléfono ya está registrado.': 'reg-phone',
                    'El correo electrónico ya está registrado.': 'reg-email',
                };
                const fieldId = fieldByMessage[err.message];
                if (fieldId) shake(container, fieldId);
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
}

function navigateByRole(rol) {
    switch (rol) {
        case "productor":
            navigate('/productor/landing-page');
            break;
        case "admin":
            navigate('/admin/inicio');
            break;
        case "organizacion":
            navigate('/usuario/marketplace');
            break;
        default:
            toastError('Usuario no permitido');
            navigate('/unlogged/inicio');
            break;
    }
}

// Prefills the register form with data from the Google JWT and hides password fields.
async function handleGoogleRegister(container, idToken, btn, originalText) {
    const payload = decodeJwtPayload(idToken);
    if (!payload) return toastError('No se pudo leer el token de Google.');

    const nameEl = container.querySelector('#reg-name');
    const lastnameEl = container.querySelector('#reg-lastname');
    const emailEl = container.querySelector('#reg-email');

    if (payload.given_name) { nameEl.value = payload.given_name; nameEl.readOnly = true; }
    if (payload.family_name) { lastnameEl.value = payload.family_name; lastnameEl.readOnly = true; }
    if (payload.email) { emailEl.value = payload.email; emailEl.readOnly = true; }

    container.querySelector('#reg-google-token').value = idToken;
    container.querySelector('#reg-password-wrap').style.display = 'none';
    container.querySelector('#reg-confirm-wrap').style.display = 'none';

    try {
        const user = await AuthService.loginGoogle(idToken);
        localStorage.setItem('token', user.id_usuario);
        toastWelcome({ title: `Bienvenido ${user.nombre_razon_social}!`, body: "Explora productos" });
        navigateByRole(user.rol_usuario);
    } catch (err) {
        btn.disabled = false;
        btn.textContent = originalText;
        toastSuccess('Cuenta de Google conectada. Selecciona tu zona y teléfono.');
    }
}

// Resets the register form to its default state (clears Google mode).
function resetRegisterForm(container) {
    container.querySelector('#registerForm').reset();
    container.querySelector('#reg-google-token').value = '';
    ['#reg-name', '#reg-lastname', '#reg-email'].forEach(sel => {
        container.querySelector(sel).readOnly = false;
    });
    container.querySelector('#reg-password-wrap').style.display = '';
    container.querySelector('#reg-confirm-wrap').style.display = '';
}

function decodeJwtPayload(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        // atob produces Latin-1 bytes; decode them as UTF-8 so accented chars survive
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}

function restoreBtn(btn, text, then) {
    btn.disabled = false;
    btn.textContent = text;
    then?.();
}

function shake(container, inputId) {
    const el = container.querySelector(`#${inputId}`);
    if (!el) return;
    el.style.borderColor = '#e53935';
    el.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' },
    ], { duration: 320, easing: 'ease' });
    setTimeout(() => el.style.borderColor = '', 1200);
}

export function init(container) {
    
    const wrapper = container.querySelector('#authWrapper');

    container.querySelector('#btnShowRegister')
        .addEventListener('click', () => wrapper.classList.add('show-register'));

    container.querySelector('#btnShowLogin')
        .addEventListener('click', () => wrapper.classList.remove('show-register'));

    container.querySelectorAll('.eye-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.style.color = isHidden ? 'var(--green)' : 'var(--muted)';
        });
    });

    container.querySelector('#loginForm')
        .addEventListener('submit', (e) => {
            e.preventDefault();
            const email    = container.querySelector('#login-email').value.trim();
            const password = container.querySelector('#login-password').value;
            if (!email || !password) return shake(container, 'login-email');
            console.log('Login:', { email, password });
        });

    container.querySelector('#registerForm')
        .addEventListener('submit', (e) => {
            e.preventDefault();
            const name     = container.querySelector('#reg-name').value.trim();
            const phone    = container.querySelector('#reg-phone').value.trim();
            const email    = container.querySelector('#reg-email').value.trim();
            const password = container.querySelector('#reg-password').value;
            const confirm  = container.querySelector('#reg-confirm').value;
            const role     = container.querySelector('input[name="role"]:checked').value;

            if (!name || !email || !password) return shake(container, 'reg-name');
            if (password !== confirm) return shake(container, 'reg-confirm');
            console.log('Register:', { name, phone, email, password, role });
        });
}

function shake(container, inputId) {
    const el = container.querySelector(`#${inputId}`);
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

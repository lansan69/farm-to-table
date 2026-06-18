// Mounts a shared toast container once, appended to <body>.
function getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = 1100;
        document.body.appendChild(container);
    }
    return container;
}

function show(el) {
    getContainer().appendChild(el);
    const instance = new bootstrap.Toast(el, { delay: 2000 });
    instance.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

// ── Success ───────────────────────────────────────────────────────────────────

export function toastSuccess(message) {
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-success border-0';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>`;
    show(el);
}

// ── Error ─────────────────────────────────────────────────────────────────────

export function toastError(message) {
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-danger border-0';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>`;
    show(el);
}

// ── Welcome ───────────────────────────────────────────────────────────────────
export function toastWelcome({ title = '¡Bienvenido!', body = '' } = {}) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="toast-header" style="background:#1B853F;color:#fff;">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close btn-close-white"
                    data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>
        <div class="toast-body" style="background:#f0f7f2;color:#1B853F;font-weight:500;">${body}</div>`;
    show(el);
}

// ── Goodbye ───────────────────────────────────────────────────────────────────

export function toastGoodbye({ title = '¡Hasta pronto!', body = '' } = {}) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="toast-header" style="background:#1B853F;color:#fff;">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close btn-close-white"
                    data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>
        <div class="toast-body" style="background:#f0f7f2;color:#1B853F;font-weight:500;">${body}</div>`;
    show(el);
}

// ── Chat: contact reported ────────────────────────────────────────────────────

export function toastContactoReportado(name) {
    toastSuccess(`Contacto "${name}" reportado.`);
}

// ── Confirm ───────────────────────────────────────────────────────────────────
// Shows a persistent toast with Confirm / Cancel buttons.
// options: { message, confirmLabel, onConfirm }

export function toastConfirm({ message = '¿Estás seguro?', confirmLabel = 'Confirmar', onConfirm } = {}) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'alertdialog');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Confirmar acción</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>
        <div class="toast-body">
            ${message}
            <div class="mt-2 d-flex gap-2">
                <button type="button" class="btn btn-sm btn-danger btn-confirm-yes">${confirmLabel}</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="toast">Cancelar</button>
            </div>
        </div>`;

    getContainer().appendChild(el);
    const instance = new bootstrap.Toast(el, { autohide: false });
    instance.show();

    el.querySelector('.btn-confirm-yes').addEventListener('click', () => {
        instance.hide();
        onConfirm?.();
    });
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

// ── Chat: conversation deleted ────────────────────────────────────────────────

export function toastConversacionEliminada(name) {
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-secondary border-0';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">Conversación con "${name}" eliminada.</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>`;
    show(el);
}

// ── Notification ──────────────────────────────────────────────────────────────
// options: { title, body, img, time }

export function toastNotification({ title = 'Notificación', body = '', img = '', time = 'ahora' } = {}) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="toast-header">
            ${img ? `<img src="${img}" class="rounded me-2" alt="" style="width:20px;height:20px;object-fit:cover;">` : ''}
            <strong class="me-auto">${title}</strong>
            <small class="text-muted">${time}</small>
            <button type="button" class="btn-close"
                    data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>
        <div class="toast-body">${body}</div>`;
    show(el);
}

// ── Loading ───────────────────────────────────────────────────────────────────

export function toastLoading(message) {
    const el = document.createElement('div');
    // Usamos text-bg-primary (azul) para diferenciarlo del success (verde)
    el.className = 'toast align-items-center text-bg-primary border-0';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>`;

    getContainer().appendChild(el);
    
    // autohide en false para que espere a que termine la petición
    const instance = new bootstrap.Toast(el, { autohide: false });
    instance.show();

    el.addEventListener('hidden.bs.toast', () => el.remove());

    // Retornamos una función para destruirlo cuando termine la carga
    return {
        hide: () => instance.hide()
    };
}
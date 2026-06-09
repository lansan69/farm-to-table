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
    const instance = new bootstrap.Toast(el, { delay: 4000 });
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

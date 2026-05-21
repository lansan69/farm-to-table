// public/components/app/app.js
import { loadComponent, BASE_PATH } from '../../../assets/js/app.js';

// ─────────────────────────────────────────
// RUTAS
// ─────────────────────────────────────────
const routes = {

    // Públicas (unlogged)
    '/landing':     'app/unlogged',
    '/login':       'app/unlogged/login',
    '/contact':     'app/unlogged/contact',

    // Privadas (logged)
    '/home':        'app/logged',
};

const publicRoutes = ['/landing', '/login', '/contact'];


// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

export function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
}


// ─────────────────────────────────────────
// NAVIGATE — lógica de rutas y auth
// ─────────────────────────────────────────
export async function navigate(path) {
    const isPublic = publicRoutes.includes(path);

    // Guardia de autenticación
    if (!isLoggedIn() && !isPublic) return navigate('/landing');
    if (isLoggedIn()  &&  isPublic) return navigate('/home');

    // Resuelve el componente a cargar
    const fallback = isLoggedIn() ? '/home' : '/landing';
    const route    = routes[path] ?? routes[fallback];

    // Contenedor destino
    const containerId = isLoggedIn() ? 'logged-content' : 'unlogged-content';
    const container   = document.getElementById(containerId);

    if (!container) {
        console.error(`Contenedor #${containerId} no encontrado`);
        return;
    }

    await loadComponent(route, container);

    window.history.pushState({}, '', BASE_PATH + path);
}


// ─────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────
export function login(token) {
    localStorage.setItem('token', token);
    navigate('/home');
}

export function logout() {
    localStorage.removeItem('token');
    navigate('/landing');
}


// ─────────────────────────────────────────
// LISTENERS
// ─────────────────────────────────────────
document.addEventListener('click', e => {
    const anchor = e.target.closest('[data-link]');
    if (!anchor) return;
    e.preventDefault();
    navigate(anchor.getAttribute('href'));
});

window.addEventListener('popstate', () => {
    const raw  = window.location.pathname || '/';
    const path = raw.startsWith(BASE_PATH) ? raw.slice(BASE_PATH.length) || '/' : raw;
    navigate(path);
});


// ─────────────────────────────────────────
// INIT — llamado por app.html cargando app.js
// ─────────────────────────────────────────
export async function init(container) {
    const raw  = window.location.pathname || '';
    const path = raw.startsWith(BASE_PATH) ? raw.slice(BASE_PATH.length) || '/landing' : raw || '/landing';
    await navigate(path);
}
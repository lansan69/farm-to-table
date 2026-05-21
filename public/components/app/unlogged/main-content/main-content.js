import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';
import { setActive } from '../nav/nav.js';

const SUB_ROUTES = {
    home:    { path: 'app/unlogged/main-content/inicio',  selector: '#unlogged-main-content-inicio' },
    login:   { path: 'app/unlogged/main-content/login',   selector: '#unlogged-main-content-login' },
    contact: { path: 'app/unlogged/main-content/contact', selector: '#unlogged-main-content-contact' },
};

export async function init(container) {
    // container  = #unlogged-main-content (our slot)
    // shell      = #unlogged-content (common ancestor — nav events bubble up to here)
    // nav is already in the DOM, loaded by unlogged.js before us
    const shell        = container.parentElement;
    const navContainer = shell.querySelector('#unlogged-nav');

    let currentRoute = 'home';
    await loadRoute(container, currentRoute);
    setActive(navContainer, currentRoute);

    shell.addEventListener('unlogged:navigate', async (e) => {
        const { route } = e.detail;
        if (!SUB_ROUTES[route] || route === currentRoute) return;

        const prevRoute  = currentRoute;
        currentRoute     = route;

        await loadRoute(container, route);
        setActive(navContainer, route);
        cleanup(container, prevRoute);
    });
}

async function loadRoute(container, route) {
    const { path, selector } = SUB_ROUTES[route];
    const slotEl = container.querySelector(selector);

    await loadComponent(path, slotEl);

    // Show this slot, hide the rest
    for (const r of Object.values(SUB_ROUTES)) {
        const el = container.querySelector(r.selector);
        if (el) el.classList.toggle('active', r.selector === selector);
    }
}

function cleanup(container, route) {
    const { path, selector } = SUB_ROUTES[route];
    const slotEl = container.querySelector(selector);
    if (slotEl) {
        slotEl.classList.remove('active');
        slotEl.innerHTML = '';
    }
    unloadComponent(path);
}

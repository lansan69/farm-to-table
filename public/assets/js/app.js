const BASE_PATH = '/dashboard/farm-to-table/public';

async function loadComponent(path, container) {
    const basePath = `${BASE_PATH}/components/${path}`;
    const name     = path.replace(/\/$/, '').split('/').pop();

    if (!document.querySelector(`link[data-component="${name}"]`)) {
        const link = document.createElement('link');
        link.rel               = 'stylesheet';
        link.href              = `${basePath}/${name}.css`;
        link.dataset.component = name;
        document.head.appendChild(link);
    }

    const html = await fetch(`${basePath}/${name}.html`).then(r => r.text());
    container.innerHTML = html;

    const module = await import(`${basePath}/${name}.js`);
    if (typeof module.init === 'function') await module.init(container);
}

async function initApp() {
    const app = document.getElementById('app');
    await loadComponent('app', app);
}

export { loadComponent, BASE_PATH };

initApp();
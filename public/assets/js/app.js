// assets/js/router.js

// Ruta base de la aplicación en el servidor
const BASE_PATH = '/dashboard/farm-to-table';

// ── Rutas ──────────────────────────────────────────────────────────────────
// Cada ruta define: qué shell la envuelve, qué página va dentro, y quién puede verla.
// auth: 'public'    → solo usuarios NO autenticados
// auth: 'protected' → solo usuarios autenticados

const routes = [
    // Rutas pra usuarios no autenticados
  { path: '/unlogged/inicio',         shell: 'app/unlogged', page: 'app/unlogged/main-content/inicio',          auth: 'public'    },
  { path: '/unlogged/contact',        shell: 'app/unlogged', page: 'app/unlogged/main-content/contact',         auth: 'public'    },
  { path: '/unlogged/login',          shell: 'app/unlogged', page: 'app/unlogged/main-content/login',           auth: 'public'    },

    // TEMPORALMENTE SE PONEN TODAS COMO PUBLICAS PARA EDICIÓN

    // Rutas para usuarios autenticados
  { path: '/usuario/landing-page',          shell: 'app/logged/user',   page: 'app/logged/user/main-content/landing-page',            auth: 'public' },
  { path: '/usuario/marketplace',           shell: 'app/logged/user',   page: 'app/logged/user/main-content/marketplace',             auth: 'public' },
  { path: '/usuario/informacion-producto',  shell: 'app/logged/user',   page: 'app/logged/user/main-content/informacion-producto',    auth: 'public' },
  { path: '/usuario/catalogo-vendedores',   shell: 'app/logged/user',   page: 'app/logged/user/main-content/catalogo-vendedores',     auth: 'public' },
  { path: '/usuario/perfil',                shell: 'app/logged/user',   page: 'app/logged/user/main-content/perfil',                  auth: 'public' },
  { path: '/usuario/chats',                 shell: 'app/logged/user',   page: 'app/logged/user/main-content/chats',                   auth: 'public' },
  { path: '/usuario/favoritos',             shell: 'app/logged/user',   page: 'app/logged/user/main-content/favoritos',               auth: 'public' },
  { path: '/usuario/contraofertas',         shell: 'app/logged/user',   page: 'app/logged/user/main-content/contraofertas',           auth: 'public' },
  { path: '/usuario/calificar-producto',    shell: 'app/logged/user',   page: 'app/logged/user/main-content/calificar-producto',      auth: 'public' },
  { path: '/usuario/compras',               shell: 'app/logged/user',   page: 'app/logged/user/main-content/compras',                 auth: 'public' },



  // Rutas para productores autenticados
  { path: '/productor/landing-page',          shell: 'app/logged/farmer',   page: 'app/logged/farmer/main-content/landing-page',            auth: 'public' },
  { path: '/productor/mis-lotes',             shell: 'app/logged/farmer',   page: 'app/logged/farmer/main-content/lotes',                   auth: 'public' },
  { path: '/productor/publicar-lote',         shell: 'app/logged/farmer',   page: 'app/logged/farmer/main-content/publicar-lote',           auth: 'public' },
  { path: '/productor/editar-lote',           shell: 'app/logged/farmer',   page: 'app/logged/farmer/main-content/editar-lote',             auth: 'public' },
  { path: '/productor/perfil',                shell: 'app/logged/farmer',   page: 'app/logged/farmer/main-content/perfil',                  auth: 'public' },
  { path: '/productor/chats',                 shell: 'app/logged/farmer',   page: 'app/logged/farmer/main-content/chats',                   auth: 'public' },
  { path: '/productor/contraofertas',         shell: 'app/logged/farmer',   page: 'app/logged/farmer/main-content/contraofertas',           auth: 'public' },
  { path: '/productor/ventas',                shell: 'app/logged/farmer',   page: 'app/logged/farmer/main-content/ventas',                  auth: 'public' },

  // Rutas para administradores
  { path: '/admin/inicio',    shell: 'app/logged/admin', page: 'app/logged/admin/main-content/inicio',    auth: 'protected' },
  { path: '/admin/usuarios',  shell: 'app/logged/admin', page: 'app/logged/admin/main-content/usuarios',  auth: 'protected' },
  { path: '/admin/zonas',     shell: 'app/logged/admin', page: 'app/logged/admin/main-content/zonas',     auth: 'protected' },
  { path: '/admin/productos', shell: 'app/logged/admin', page: 'app/logged/admin/main-content/productos', auth: 'protected' },
  { path: '/admin/reportes', shell: 'app/logged/admin',  page: 'app/logged/admin/main-content/reportes',  auth: 'protected' },

];




// ── cargarComponente ──────────────────────────────────────────────────────
// Dada una ruta como 'app/unlogged', esta función:
// 1. Inyecta  components/app/unlogged/unlogged.css  en <head> (si no existe ya)
// 2. Obtiene  components/app/unlogged/unlogged.html → asigna el HTML al contenedor
// 3. Importa  components/app/unlogged/unlogged.js   → ejecuta init(container)

export async function loadComponent(path, container) {
  // Construye la ruta base del componente y extrae su nombre
  const basePath = `${BASE_PATH}/public/components/${path}`;
  const name     = path.split('/').pop();
  // Use full path as key to avoid collisions between same-named components
  // in different shells (e.g. app/unlogged/nav vs app/logged/user/nav).
  const cssKey   = path.replaceAll('/', '-');

  // Inyecta el CSS del componente solo si no está ya en el documento
  if (!document.querySelector(`link[data-component="${cssKey}"]`)) {
    const link = document.createElement('link');
    link.rel               = 'stylesheet';
    link.href              = `${basePath}/${name}.css`;
    link.dataset.component = cssKey;
    document.head.appendChild(link);
  }

  // Carga el HTML del componente y lo inserta en el contenedor
  const html = await fetch(`${basePath}/${name}.html`).then(r => r.text());
  container.innerHTML = html;

  // Importa el módulo JS del componente y llama a su función init si existe
  const module = await import(`${basePath}/${name}.js`);
  if (typeof module.init === 'function') await module.init(container);
}

// ── descargarComponente ────────────────────────────────────────────────────
// Elimina el CSS del componente del <head> y ejecuta su función cleanup() si existe.
// El HTML se elimina automáticamente cuando el contenedor padre recibe nuevo innerHTML.

export async function unloadComponent(path) {
  const name   = path.split('/').pop();
  const cssKey = path.replaceAll('/', '-');

  const module = await import(`${BASE_PATH}/public/components/${path}/${name}.js`);
  if (typeof module.cleanup === 'function') await module.cleanup();
}

// ── Autenticación ───────────────────────────────────────────────────────────
// Verifica si hay un token de sesión guardado en localStorage

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

// Almacena la ruta actualmente cargada para detectar cambios de shell
let currentRoute = null;

// ── Router ─────────────────────────────────────────────────────────────────
// Función principal del enrutador: evalúa la URL actual y carga el componente correcto

async function router() {
  // Obtiene la ruta relativa eliminando el BASE_PATH
  const path = window.location.pathname.replace(BASE_PATH, '') || '/';
  console.log('Navegando a:', path);
  const app  = document.getElementById('app');

  // Si es la raíz, redirige según si el usuario está autenticado o no
  if (path === '/') return navigate(isLoggedIn() ? '/usuario/marketplace' : '/unlogged/inicio');

  // Busca la ruta en la tabla de rutas definida
  const route = routes.find(r => r.path === path);
    console.log('Ruta encontrada:', route);

  // Si no se encontró la ruta, muestra un error 404
  if (!route) {
    app.innerHTML = '<p>404 — Página no encontrada</p>';
    return;
  }

  // Redirige si el usuario intenta acceder a una ruta que no le corresponde
  if (route.auth === 'protected' && !isLoggedIn()) return navigate('/unlogged/login');

  // Ya estamos en esta ruta — nada que hacer
  if (currentRoute && currentRoute.path === route.path) return;

  // Verifica si la shell (estructura base) cambió respecto a la ruta anterior
  const shellChanged = !currentRoute || currentRoute.shell !== route.shell;

  if (shellChanged) {
    // Si la shell cambió, descarga la anterior y carga la nueva
    if (currentRoute) await unloadCurrent();
    await loadComponent(route.shell, app);
  } else {
    // Si la shell es la misma, solo descarga la página anterior
    if (currentRoute) await unloadComponent(currentRoute.page);
  }

  // Carga la nueva página dentro del contenedor de contenido
  const pageContainer = app.querySelector('#page-content');
  await loadComponent(route.page, pageContainer);
  currentRoute = route;
}

// Descarga la página y shell actuales, y limpia la ruta en memoria
async function unloadCurrent() {
  if (!currentRoute) return;
  await unloadComponent(currentRoute.page);
  await unloadComponent(currentRoute.shell);
  currentRoute = null;
}

// ── navegar() — usar esta función en lugar de window.location directamente ────────────
// Actualiza el historial del navegador y lanza el router

export function navigate(path) {
  history.pushState({}, '', BASE_PATH + path);
  document.dispatchEvent(new CustomEvent('ftt:navigate', { detail: { path } }));
  router();
}

// ── Interceptar clics en enlaces con data-link ─────────────────────────────
// Captura los clics en <a data-link> para navegar sin recargar la página

document.addEventListener('click', e => {
  const link = e.target.closest('a[data-link]');
  if (!link) return;
  e.preventDefault(); // Evita la navegación nativa del navegador
  navigate(link.getAttribute('href'));
});

// ── Navegación con botones atrás/adelante del navegador ───────────────────
// Escucha el evento popstate para manejar la navegación por historial

window.addEventListener('popstate', router);

// ── Arranque de la aplicación ───────────────────────────────────────────────
// Ejecuta el router al cargar la página por primera vez

router();

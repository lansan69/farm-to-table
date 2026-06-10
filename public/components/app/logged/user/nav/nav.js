import { navigate } from '../../../../../assets/js/app.js';
import { toastSuccess, toastError, toastNotification, toastGoodbye } from '../../../../../assets/js/toast.js';

let _clickHandler = null;

export function init(container) {
  // ── Hamburger ────────────────────────────────────────────────────────────
  const btn    = container.querySelector('#hamburgerBtn');
  const navbar = container.querySelector('.ftt-navbar');

  btn?.addEventListener('click', function () {
    const open = this.classList.toggle('is-open');
    this.setAttribute('aria-expanded', open);
    this.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    navbar.classList.toggle('menu-open', open);
  });

  function closeMenu() {
    btn?.classList.remove('is-open');
    btn?.setAttribute('aria-expanded', 'false');
    btn?.setAttribute('aria-label', 'Abrir menú');
    navbar.classList.remove('menu-open');
  }

  // ── Nav links ────────────────────────────────────────────────────────────
  const links = container.querySelectorAll('[data-nav]');

  function setActive(path) {
    links.forEach(l => l.classList.toggle('active', l.dataset.nav === path));
  }

  function handleClick(e) {
    if (e.target.closest('[data-action="logout"]')) {
      toastGoodbye({ title: "¡Hasta pronto!", body: "Cerrando tu sesión…" });
      closeMenu();
      localStorage.clear();
      sessionStorage.clear();
      // give toast a moment to display before navigating
      setTimeout(() => navigate('/unlogged/inicio'), 2000);
      return;
    }

    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    closeMenu();
    setActive(link.dataset.nav);
    navigate(link.dataset.nav);
  }

  // Set active on mount based on current URL
  setActive(window.location.pathname.replace('/dashboard/farm-to-table', ''));

  // Keep active state in sync with programmatic navigation
  document.addEventListener('ftt:navigate', (e) => setActive(e.detail.path));

  container.addEventListener('click', handleClick);
  _clickHandler = { container, handleClick };
  
}

export function cleanup() {
  if (_clickHandler) {
    _clickHandler.container.removeEventListener('click', _clickHandler.handleClick);
    _clickHandler = null;
  }
}

import { navigate } from '../../../../assets/js/app.js';

let _clickHandler = null;

export function init(container) {
  // ── Hamburger ────────────────────────────────────────────────────────────
  const btn = container.querySelector('#hamburgerBtn');
  btn?.addEventListener('click', function () {
    const open = this.classList.toggle('is-open');
    this.setAttribute('aria-expanded', open);
    this.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });

  // ── Nav links ────────────────────────────────────────────────────────────
  const links = container.querySelectorAll('[data-nav]');

  function setActive(path) {
    links.forEach(l => l.classList.toggle('active', l.dataset.nav === path));
  }

  function handleClick(e) {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    setActive(link.dataset.nav);
    navigate(link.dataset.nav);
  }

  // Set active on mount based on current URL
  setActive(window.location.pathname.replace('/dashboard/farm-to-table', ''));

  container.addEventListener('click', handleClick);
  _clickHandler = { container, handleClick };
  
}

export function cleanup() {
  if (_clickHandler) {
    _clickHandler.container.removeEventListener('click', _clickHandler.handleClick);
    _clickHandler = null;
  }
}

export function init(container) {
  const hamburgerBtn = container.querySelector('#hamburgerBtn');
  if (!hamburgerBtn) return;

  hamburgerBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const isOpen = this.classList.toggle('is-open');
    this.setAttribute('aria-expanded', isOpen);
    this.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  container.querySelectorAll('[data-route]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      container.dispatchEvent(new CustomEvent('unlogged:navigate', {
        detail: { route: link.dataset.route },
        bubbles: true,
      }));
    });
  });
}

export function setActive(container, route) {
  container.querySelectorAll('[data-route]').forEach(el => el.classList.remove('active'));
  const target = container.querySelector(`[data-route="${route}"]`);
  if (target) target.classList.add('active');
}

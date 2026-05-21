export function init(container) {
  const hamburgerBtn = container.querySelector('#hamburgerBtn');
  if (!hamburgerBtn) return;

  hamburgerBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const isOpen = this.classList.toggle('is-open');
    this.setAttribute('aria-expanded', isOpen);
    this.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });
}

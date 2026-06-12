import { userCache }         from '../../user.js';
import { createVendorCard }  from '../../../../../../assets/js/components/vendor-components.js';
import { createSearchBar }   from '../../../../../../assets/js/components/chat-components.js';

export async function init(container) {
  const grid        = container.querySelector('#vendorsGrid');
  const searchSlot  = container.querySelector('#vendor-search');
  const filtersWrap = container.querySelector('.filters-wrap');
  const filtersBar  = filtersWrap.querySelector('.filters');
  const toggleBtn   = filtersWrap.querySelector('.filters-toggle');

  let activeZone  = '';
  let searchQuery = '';

  // ── Search bar ────────────────────────────────────────────────────────────────

  searchSlot.innerHTML = createSearchBar('Buscar vendedor…');
  const searchInput = searchSlot.querySelector('.chat-search-bar__input');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderGrid();
  });

  // ── Hamburger toggle ──────────────────────────────────────────────────────────

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = filtersWrap.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!filtersWrap.contains(e.target)) {
      filtersWrap.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // ── Zone filter click (event delegation on the bar) ───────────────────────────

  filtersBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;

    filtersBar.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeZone = btn.dataset.zone ?? '';

    filtersWrap.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');

    renderGrid();
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function buildZoneFilters(vendors) {
    const zones = [...new Set(vendors.map(v => v.zona).filter(Boolean))].sort();

    filtersBar.querySelectorAll('.filter[data-zone]:not([data-zone=""])').forEach(b => b.remove());

    zones.forEach(zone => {
      const btn = document.createElement('button');
      btn.className    = 'filter';
      btn.dataset.zone = zone;
      btn.textContent  = zone;
      filtersBar.appendChild(btn);
    });
  }

  function renderGrid() {
    const vendors = userCache.vendedores;

    const filtered = vendors.filter(v => {
      const matchesZone   = !activeZone || v.zona === activeZone;
      const matchesSearch = !searchQuery
        || (v.nombre_razon_social || '').toLowerCase().includes(searchQuery);
      return matchesZone && matchesSearch;
    });

    if (!filtered.length) {
      grid.innerHTML = '<p class="vendors-empty">No se encontraron vendedores.</p>';
      return;
    }

    grid.innerHTML = filtered.map(v => createVendorCard({
      id:          v.id_usuario,
      name:        v.nombre_razon_social,
      rating:      parseFloat(v.puntuacion_promedio) || 0,
      zona:        v.zona,
      mainProduct: v.producto_principal,
    })).join('');
  }

  // ── Render from cache (no fetch needed) ───────────────────────────────────────

  buildZoneFilters(userCache.vendedores);
  renderGrid();
}

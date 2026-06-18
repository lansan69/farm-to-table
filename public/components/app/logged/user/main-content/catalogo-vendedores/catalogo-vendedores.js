import { userCache }         from '../../user.js';
import { createVendorCard, createVendorCardExpanded }  from '../../../../../../assets/js/components/vendor-components.js';
import { createSearchBar }   from '../../../../../../assets/js/components/chat-components.js';
import { navigate } from '../../../../../../assets/js/app.js';

export async function init(container) {
  const grid        = container.querySelector('#vendorsGrid');
  const searchSlot  = container.querySelector('#vendor-search');
  const filtersWrap = container.querySelector('.filters-wrap');
  const filtersBar  = filtersWrap.querySelector('.filters');
  const toggleBtn   = filtersWrap.querySelector('.filters-toggle');
  console.log("vendedore: ", userCache.vendedores);
  let activeZone  = '';
  let searchQuery = '';

  // ── Overlay para la tarjeta expandida ─────────────────────────────────────────
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '9999',
    display: 'none', alignItems: 'center', justifyContent: 'center', padding: '20px'
  });
  
  // Agregamos el modal al DOM
  document.body.appendChild(overlay);

  // Cerrar el modal al hacer clic fuera de la tarjeta o en el botón de cerrar
  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.closest('.close-overlay-btn')) {
      overlay.style.display = 'none';
    }
  });

  // ── Interacción con el Grid ───────────────────────────────────────────────────
  grid.addEventListener('click', e => {
    const card = e.target.closest('.vendor-card');
    if (!card) return;

    const vendorId = parseInt(card.dataset.id, 10);
    const vendorData = userCache.vendedores.find(v => v.id_usuario === vendorId);

    if (e.target.closest('.vendor-cta-btn')) {
      const nombre = vendorData
      localStorage.setItem("productorSearchString", vendorData.nombre_razon_social);
      navigate('/usuario/marketplace');
      return;
    }


    if (vendorData) {
      // Inyectamos la tarjeta expandida dentro del overlay
      overlay.innerHTML = `
        <div class="position-relative w-100 mx-auto" style="max-width: 500px; animation: modalFadeIn 0.3s ease-out;">
          <button type="button" class="btn-close position-absolute m-3 close-overlay-btn" 
                  style="top: 10px; right: 10px; z-index: 10;" aria-label="Cerrar"></button>
          ${createVendorCardExpanded(vendorData)}
        </div>
      `;
      overlay.style.display = 'flex';
    }
  });

  // ── Search bar ────────────────────────────────────────────────────────────────

  searchSlot.innerHTML = createSearchBar('Buscar vendedor…');
  const searchInput = searchSlot.querySelector('.chat-search-bar__input');
  searchInput.parentElement.style.position = 'relative';

  const clearBtn = document.createElement('button');
  clearBtn.innerHTML = '✕';
  Object.assign(clearBtn.style, {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    display: 'none',
    fontSize: '16px',
    padding: '4px'
  });
  searchInput.parentElement.appendChild(clearBtn);

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
    renderGrid();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.style.display = 'none';
    renderGrid();
    searchInput.focus();
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
      foto:        v.foto,
    })).join('');
  }

  // ── Render from cache (no fetch needed) ───────────────────────────────────────

  buildZoneFilters(userCache.vendedores);
  renderGrid();
}
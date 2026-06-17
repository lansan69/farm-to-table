import { adminCache }                from '../../../admin/admin.js';
import { createSearchBar }          from '../../../../../../assets/js/components/chat-components.js';
import { createAdminProductCard }   from '../../../../../../assets/js/components/admin-components.js';
import { LotesService }             from '../../../../../../assets/js/services/lotes.js';
import { toastSuccess, toastError } from '../../../../../../assets/js/toast.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapLoteAdmin(l) {
  return {
    id:     l.id_lote,
    name:   l.nombre_producto,
    vendor: l.nombre_productor,
    rating: parseFloat(l.calificacion_producto) || 0,
    price:  parseFloat(l.precio_recuperacion_sugerido) || 0,
    status: l.estado_lote === 'disponible' ? 'Disponible' : 'En negociación',
    estado: l.estado_lote,
    catId:  l.id_categoria,
    zona:   l.zona || '',
    image:  'assets/images/login/frutas.jpeg',
  };
}

// ── Edit modal ────────────────────────────────────────────────────────────────

const ESTADO_OPTIONS_ADMIN = [
  { value: 'disponible',     label: 'Disponible' },
  { value: 'en_negociacion', label: 'En negociación' },
  { value: 'asignado',       label: 'Asignado' },
  { value: 'caducado',       label: 'Caducado' },
];

function injectEditModal() {
  document.getElementById('admin-edit-lote-modal')?.remove();

  const modal = document.createElement('div');
  modal.id        = 'admin-edit-lote-modal';
  modal.className = 'modal fade';
  modal.tabIndex  = -1;

  const estadoOpts = ESTADO_OPTIONS_ADMIN.map(o =>
    `<option value="${o.value}">${o.label}</option>`
  ).join('');

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header" style="border-bottom:1px solid #eee;">
          <h5 class="modal-title" style="font-size:15px;font-weight:700;">
            Editar: <span id="ae-product-name" style="color:var(--color-primary-green)"></span>
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:16px;padding:24px;">
          <div>
            <label class="ae-label">Precio ($/kg)</label>
            <input id="ae-precio" type="number" min="0" step="0.01" placeholder="0.00" class="ae-input" />
          </div>
          <div>
            <label class="ae-label">Estado</label>
            <select id="ae-estado" class="ae-input ae-select">
              ${estadoOpts}
            </select>
          </div>
        </div>
        <div class="modal-footer" style="border-top:1px solid #eee;gap:8px;">
          <button type="button" class="ae-btn ae-btn--cancel" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" id="ae-guardar" class="ae-btn ae-btn--confirm">Guardar</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

// ── Component ─────────────────────────────────────────────────────────────────

export async function init(container) {
  const searchSlot   = container.querySelector('#prod-admin-search');
  const productsGrid = container.querySelector('#productsGridAdmin');
  const filtersWrap  = container.querySelector('.filters-wrap');
  const toggleBtn    = container.querySelector('.filters-toggle');
  const filtersEl    = container.querySelector('.filters');

  searchSlot.innerHTML = createSearchBar('Buscar productos...');
  const searchInput = searchSlot.querySelector('.chat-search-bar__input');

  let currentCatId = 0;
  let searchTerm   = '';

  adminCache.categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className     = 'filter';
    btn.dataset.catId = cat.id_categoria;
    btn.textContent   = cat.nombre_categoria;
    filtersEl.appendChild(btn);
  });

  console.log("Admin caché in prods; ", adminCache);
  let allProducts = adminCache.productos.map(mapLoteAdmin);
  renderProducts();

  // ── Hamburger toggle ──────────────────────────────────────────────────
  toggleBtn?.addEventListener('click', () => {
    const isOpen = filtersWrap.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', e => {
    if (!filtersWrap.contains(e.target)) {
      filtersWrap.classList.remove('open');
      toggleBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  // ── Filter click ───────────────────────────────────────────────────────
  filtersEl.addEventListener('click', e => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    filtersEl.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCatId = parseInt(btn.dataset.catId) || 0;
    filtersWrap.classList.remove('open');
    toggleBtn?.setAttribute('aria-expanded', 'false');
    renderProducts();
  });

  // ── Search input ───────────────────────────────────────────────────────
  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    renderProducts();
  });

  // ── Edit modal ─────────────────────────────────────────────────────────
  const modalEl  = injectEditModal();
  const bsModal  = new bootstrap.Modal(modalEl);
  const aeName   = modalEl.querySelector('#ae-product-name');
  const aePrecio = modalEl.querySelector('#ae-precio');
  const aeEstado = modalEl.querySelector('#ae-estado');
  const aeGuardar = modalEl.querySelector('#ae-guardar');

  let activeLotId = null;

  productsGrid.addEventListener('click', e => {
    const btn = e.target.closest('.admin-prod-edit-btn');
    if (!btn) return;

    activeLotId        = parseInt(btn.dataset.id);
    aeName.textContent = btn.dataset.name;
    aePrecio.value     = btn.dataset.price;
    aeEstado.value     = btn.dataset.estado;
    bsModal.show();
  });

  aeGuardar.addEventListener('click', async () => {
    const precio = parseFloat(aePrecio.value);
    if (!precio || precio <= 0) { aePrecio.focus(); return; }

    aeGuardar.disabled    = true;
    aeGuardar.textContent = 'Guardando…';
    try {
      await LotesService.actualizar(activeLotId, { precio, estado: aeEstado.value });

      const idx = allProducts.findIndex(p => p.id === activeLotId);
      if (idx !== -1) {
        allProducts[idx].price  = precio;
        allProducts[idx].estado = aeEstado.value;
        allProducts[idx].status = aeEstado.value === 'disponible' ? 'Disponible' : 'En negociación';
      }

      bsModal.hide();
      renderProducts();
      toastSuccess('Lote actualizado correctamente.');
    } catch (err) {
      toastError('No se pudo actualizar el lote.');
      console.error(err);
    } finally {
      aeGuardar.disabled    = false;
      aeGuardar.textContent = 'Guardar';
    }
  });

  // ── Delete ─────────────────────────────────────────────────────────────
  productsGrid.addEventListener('click', async e => {
    const btn = e.target.closest('.admin-prod-delete-btn');
    if (!btn) return;

    const lotId = parseInt(btn.dataset.id);
    const name  = btn.dataset.name;

    if (!confirm(`¿Eliminar el lote "${name}"? Esta acción no se puede deshacer.`)) return;

    btn.disabled = true;
    try {
      await LotesService.eliminar(lotId);
      allProducts = allProducts.filter(p => p.id !== lotId);
      renderProducts();
      toastSuccess('Lote eliminado correctamente.');
    } catch (err) {
      toastError('No se pudo eliminar el lote.');
      console.error(err);
      btn.disabled = false;
    }
  });

  // ── Render ─────────────────────────────────────────────────────────────
  function renderProducts() {
    const term = searchTerm.toLowerCase();

    const filtered = allProducts.filter(p => {
      const matchCat    = currentCatId === 0 || p.catId === currentCatId;
      const matchSearch = p.name.toLowerCase().includes(term)
                       || p.vendor.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    productsGrid.innerHTML = filtered.length
      ? filtered.map(p => createAdminProductCard(p)).join('')
      : '<p class="prod-admin-empty">No se encontraron productos.</p>';
  }
}

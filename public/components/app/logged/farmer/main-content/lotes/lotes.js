import { farmerCache }              from '../../farmer.js';
import { navigate }                  from '../../../../../../assets/js/app.js';
import { createSearchBar }           from '../../../../../../assets/js/components/chat-components.js';
import { createLoteCard }            from '../../../../../../assets/js/components/marketplace-components.js';
import { LotesService }              from '../../../../../../assets/js/services/lotes.js';
import { toastSuccess, toastError }  from '../../../../../../assets/js/toast.js';

const EXCLUDED = ['caducado', 'eliminado'];

function mapLote(l) {
  return {
    id:        l.id_lote,
    name:      l.nombre_producto_display || l.nombre_producto || 'Sin nombre',
    categoria: l.nombre_categoria || '',
    price:     parseFloat(l.precio_recuperacion_sugerido) || 0,
    estado:    l.estado_lote,
    cantidad:  parseFloat(l.cantidad_kg) || 0,
    fecha:     l.fecha_cosecha || '',
    image:     'assets/images/login/frutas.jpeg',
  };
}

export async function init(container) {
  const userId     = farmerCache.userId;
  const searchSlot = container.querySelector('#lotes-search');
  const lotesGrid  = container.querySelector('#lotesGrid');

  searchSlot.innerHTML = createSearchBar('Buscar lotes...');
  const searchInput = searchSlot.querySelector('.chat-search-bar__input');

  let allLotes   = farmerCache.lotes
    .filter(l => !EXCLUDED.includes(l.estado_lote))
    .map(mapLote);
  let searchTerm = '';

  renderLotes();

  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    renderLotes();
  });

  // ── Estado select ──────────────────────────────────────────────────────────
  lotesGrid.addEventListener('change', async e => {
    const sel = e.target.closest('.lote-estado-select');
    if (!sel) return;

    const lotId    = parseInt(sel.dataset.id);
    const newState = sel.value;
    const prev     = sel.dataset.prev;

    sel.disabled     = true;
    sel.dataset.prev = newState;

    try {
      await LotesService.cambiarEstado(lotId, userId, newState);
      toastSuccess('Estado actualizado.');
      // Sync allLotes so re-renders are consistent
      const lote = allLotes.find(l => l.id === lotId);
      if (lote) lote.estado = newState;
    } catch (err) {
      sel.value        = prev;
      sel.dataset.prev = prev;
      toastError('No se pudo actualizar el estado.');
    } finally {
      sel.disabled = false;
    }
  });

  // ── Eliminar button ────────────────────────────────────────────────────────
  lotesGrid.addEventListener('click', async e => {
    const btn = e.target.closest('.lote-eliminar-btn');
    if (!btn) return;

    const lotId = parseInt(btn.dataset.id);
    if (!confirm('¿Seguro que deseas eliminar este lote?')) return;

    btn.disabled = true;

    try {
      await LotesService.cambiarEstado(lotId, userId, 'eliminado');
      allLotes = allLotes.filter(l => l.id !== lotId);
      renderLotes();
      toastSuccess('Lote eliminado.');
    } catch (err) {
      btn.disabled = false;
      toastError('No se pudo eliminar el lote.');
    }
  });

  // ── Editar button ──────────────────────────────────────────────────────────
  lotesGrid.addEventListener('click', e => {
    const btn = e.target.closest('.lote-editar-btn');
    if (!btn) return;
    sessionStorage.setItem('editarLoteId', btn.dataset.id);
    navigate('/productor/editar-lote');
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  function renderLotes() {
    const term     = searchTerm.toLowerCase();
    const filtered = allLotes.filter(l =>
      l.name.toLowerCase().includes(term) ||
      l.categoria.toLowerCase().includes(term)
    );
    lotesGrid.innerHTML = filtered.length
      ? filtered.map(createLoteCard).join('')
      : '<p class="market-empty">No se encontraron lotes.</p>';
  }
}

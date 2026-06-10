import { createSearchBar }      from '../../../../../../assets/js/components/chat-components.js';
import { createProductCard }    from '../../../../../../assets/js/components/marketplace-components.js';
import { MarketplaceService }   from '../../../../../../assets/js/services/marketplace.js';
import { FavoritosService }     from '../../../../../../assets/js/services/favoritos.js';
import { NegociacionesService } from '../../../../../../assets/js/services/negociaciones.js';
import { toastSuccess, toastError } from '../../../../../../assets/js/toast.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapLote(l) {
  return {
    id:     l.id_lote,
    name:   l.nombre_producto,
    vendor: l.nombre_productor,
    rating: parseFloat(l.calificacion_producto) || 0,
    price:  parseFloat(l.precio_recuperacion_sugerido) || 0,
    status: l.estado_lote === 'disponible' ? 'Disponible' : 'En negociación',
    catId:  l.id_categoria,
    zona:   l.zona || '',
    image:  'assets/images/login/frutas.jpeg',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

function injectModal() {
  document.getElementById('market-contraoferta-modal')?.remove();

  const modal = document.createElement('div');
  modal.id        = 'market-contraoferta-modal';
  modal.className = 'modal fade';
  modal.tabIndex  = -1;
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header" style="border-bottom:1px solid #eee;">
          <h5 class="modal-title" style="font-size:15px;font-weight:700;">
            Contraofertar: <span id="mc-product-name" style="color:var(--color-primary-green)"></span>
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:16px;padding:24px;">
          <div>
            <label class="mc-label">Tu oferta ($/kg)</label>
            <input id="mc-monto" type="number" min="0" step="0.01" placeholder="0.00"
                   class="mc-input" />
          </div>
          <div>
            <label class="mc-label">Comentario <span style="color:#aaa;font-weight:400;">(opcional)</span></label>
            <textarea id="mc-comentario" rows="3" placeholder="Ej. Recojo en planta, pago inmediato…"
                      class="mc-input mc-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer" style="border-top:1px solid #eee;gap:8px;">
          <button type="button" class="mc-btn mc-btn--cancel" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" id="mc-confirmar" class="mc-btn mc-btn--confirm">Confirmar</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

export async function init(container) {
  const userId       = parseInt(localStorage.getItem('token'), 10) || null;
  const searchSlot   = container.querySelector('#market-search');
  const productsGrid = container.querySelector('#productsGrid');
  const filtersWrap  = container.querySelector('.filters-wrap');
  const toggleBtn    = container.querySelector('.filters-toggle');
  const filtersEl    = container.querySelector('.filters');

  searchSlot.innerHTML = createSearchBar('Buscar productos...');
  const searchInput = searchSlot.querySelector('.chat-search-bar__input');

  let allProducts  = [];
  let favSet       = new Set();   // id_lote values the user has favorited
  let currentCatId = 0;          // 0 = all categories
  let searchTerm   = '';

  // ── Skeleton ───────────────────────────────────────────────────────────
  productsGrid.innerHTML = Array(8).fill(
    '<div class="product-card product-card--skeleton"></div>'
  ).join('');

  // ── Fetch categories, products and favorites in parallel ───────────────
  try {
    const requests = [
      MarketplaceService.getCategorias(),
      MarketplaceService.getLotes(),
    ];
    if (userId) requests.push(FavoritosService.getFavoritos(userId));

    const [categorias, lotes, favs = []] = await Promise.all(requests);

    favs.forEach(f => favSet.add(f.id_lote));

    categorias.forEach(cat => {
      const btn = document.createElement('button');
      btn.className     = 'filter';
      btn.dataset.catId = cat.id_categoria;
      btn.textContent   = cat.nombre_categoria;
      filtersEl.appendChild(btn);
    });

    allProducts = lotes.map(mapLote);
    renderProducts();
  } catch (err) {
    console.error('Error cargando marketplace:', err);
    productsGrid.innerHTML = '<p class="market-empty">No se pudieron cargar los productos.</p>';
  }

  // ── Hamburger toggle ──────────────────────────────────────────────────
  toggleBtn?.addEventListener('click', () => {
    const isOpen = filtersWrap.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  // Close dropdown when clicking outside
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
    // Close dropdown on mobile after selection
    filtersWrap.classList.remove('open');
    toggleBtn?.setAttribute('aria-expanded', 'false');
    renderProducts();
  });

  // ── Search input ───────────────────────────────────────────────────────
  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    renderProducts();
  });

  // ── Fav button (event delegation — survives re-renders) ────────────────
  productsGrid.addEventListener('click', async e => {
    const btn = e.target.closest('.product-fav-btn');
    if (!btn || !userId) return;

    const lotId   = parseInt(btn.dataset.id);
    const nowFav  = btn.classList.toggle('active');   // optimistic UI
    if (nowFav) {
      favSet.add(lotId);
      toastSuccess('Agregado a favoritos.');
    } else {
      favSet.delete(lotId);
    }

    try {
      await FavoritosService.toggleFavorito(userId, lotId);
    } catch (err) {
      // Revert on failure
      btn.classList.toggle('active');
      if (nowFav) favSet.delete(lotId); else favSet.add(lotId);
      console.error('Error toggling favorito:', err);
    }
  });

  // ── Contraofertar modal ────────────────────────────────────────────────
  const modalEl    = injectModal();
  const bsModal    = new bootstrap.Modal(modalEl);
  const mcName     = modalEl.querySelector('#mc-product-name');
  const mcMonto    = modalEl.querySelector('#mc-monto');
  const mcComent   = modalEl.querySelector('#mc-comentario');
  const mcConfirm  = modalEl.querySelector('#mc-confirmar');

  let activeLotId = null;

  productsGrid.addEventListener('click', e => {
    const btn = e.target.closest('.product-cta-btn');
    if (!btn) return;

    const lotId   = parseInt(btn.dataset.id);
    const product = allProducts.find(p => p.id === lotId);
    if (!product) return;

    activeLotId    = lotId;
    mcName.textContent = product.name;
    mcMonto.value  = '';
    mcComent.value = '';
    bsModal.show();
  });

  mcConfirm.addEventListener('click', async () => {
    const monto = parseFloat(mcMonto.value);
    if (!monto || monto <= 0) {
      mcMonto.focus();
      return;
    }
    if (!userId) return;

    mcConfirm.disabled = true;
    mcConfirm.textContent = 'Enviando…';
    try {
      await NegociacionesService.iniciar({
        id_lote:     activeLotId,
        id_comprador: userId,
        monto,
        comentario: mcComent.value.trim() || null,
      });
      bsModal.hide();
      toastSuccess('Negociación iniciada correctamente.');
    } catch (err) {
      toastError('No se pudo iniciar la negociación.');
      console.error(err);
    } finally {
      mcConfirm.disabled = false;
      mcConfirm.textContent = 'Confirmar';
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
      ? filtered.map(p => createProductCard({ ...p, isFav: favSet.has(p.id) })).join('')
      : '<p class="market-empty">No se encontraron productos.</p>';
  }
}

import { userCache, updateData }              from '../../user.js';
import { createSearchBar }         from '../../../../../../assets/js/components/chat-components.js';
import { createProductCard, createProductCardExpanded } from '../../../../../../assets/js/components/marketplace-components.js';
import { FavoritosService }        from '../../../../../../assets/js/services/favoritos.js';
import { NegociacionesService }    from '../../../../../../assets/js/services/negociaciones.js';
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
    image:  `assets/images/login/${l.foto}`,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
function renderSkeletons(count = 8) {
  // Crea un array con 'count' esqueletos y los une en un string HTML
  const skeletonsHTML = Array(count)
    .fill('<article class="product-card--skeleton"></article>')
    .join('');
  
  productsGrid.innerHTML = skeletonsHTML;
}

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
  const userId       = userCache.userId;
  const searchSlot   = container.querySelector('#market-search');
  const productsGrid = container.querySelector('#productsGrid');
  const filtersWrap  = container.querySelector('.filters-wrap');
  const toggleBtn    = container.querySelector('.filters-toggle');
  const filtersEl    = container.querySelector('.filters');

  searchSlot.innerHTML = createSearchBar('Buscar productos...');
  const searchInput = searchSlot.querySelector('.chat-search-bar__input');

  let favSet       = new Set();
  let currentCatId = 0;
  let searchTerm   = '';

  // ── Populate from cache ─────────────────────────────────────────────────
  userCache.favoritos.forEach(f => favSet.add(f.id_lote));

  userCache.categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className     = 'filter';
    btn.dataset.catId = cat.id_categoria;
    btn.textContent   = cat.nombre_categoria;
    filtersEl.appendChild(btn);
  });

  const allProducts = userCache.lotes.map(mapLote);
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

  // ── Handlers reutilizables (Fav & Contraoferta) ────────────────────────
  async function handleFavToggle(btn) {
    if (!userId) return;
    const lotId  = parseInt(btn.dataset.id);
    const nowFav = btn.classList.toggle('active');
    
    if (nowFav) {
      favSet.add(lotId);
      toastSuccess('Agregado a favoritos.');
    } else {
      favSet.delete(lotId);
    }

    try {
      updateData();
      await FavoritosService.toggleFavorito(userId, lotId);
    } catch (err) {
      btn.classList.toggle('active');
      if (nowFav) favSet.delete(lotId); else favSet.add(lotId);
      console.error('Error toggling favorito:', err);
    }
  }

  function handleContraoferta(btn) {
    const lotId   = parseInt(btn.dataset.id);
    const product = allProducts.find(p => p.id === lotId);
    if (!product) return;

    activeLotId        = lotId;
    mcName.textContent = product.name;
    mcMonto.value      = '';
    mcComent.value     = '';
    bsModal.show();
  }

  // ── Overlay Expandido ──────────────────────────────────────────────────
  const expandedOverlay = document.createElement('div');
  expandedOverlay.id = 'market-expanded-overlay';
  Object.assign(expandedOverlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '9999',
    display: 'none', alignItems: 'center', justifyContent: 'center', padding: '20px'
  });
  document.body.appendChild(expandedOverlay);

  expandedOverlay.addEventListener('click', e => {
    // Cerrar overlay al tocar fondo o botón X
    if (e.target === expandedOverlay || e.target.closest('.mc-close-btn')) {
      expandedOverlay.style.display = 'none';
      return;
    }
    // Reutilizar lógica de botones internos
    const favBtn = e.target.closest('.product-fav-btn');
    if (favBtn) handleFavToggle(favBtn);

    const ctaBtn = e.target.closest('.product-cta-btn');
    if (ctaBtn) {
      expandedOverlay.style.display = 'none'; // Cerrar overlay al abrir modal
      handleContraoferta(ctaBtn);
    }
  });

  // ── Product Grid Clicks ────────────────────────────────────────────────
  productsGrid.addEventListener('click', e => {
    const favBtn = e.target.closest('.product-fav-btn');
    if (favBtn) return handleFavToggle(favBtn);

    const ctaBtn = e.target.closest('.product-cta-btn');
    if (ctaBtn) return handleContraoferta(ctaBtn);

    // Clic en la tarjeta (abrir vista expandida)
    const card = e.target.closest('.product-card');
    if (card) {
      const lotId = parseInt(card.dataset.id);
      const rawProduct = userCache.lotes.find(l => l.id_lote === lotId);
      if (!rawProduct) return;

      expandedOverlay.innerHTML = `
        <div style="position: relative; max-width: 600px; width: 100%; border-radius: 14px; background: #fff; max-height: 90vh; overflow-y: auto;">
          <button class="mc-close-btn" style="position: absolute; top: 12px; right: 12px; background: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; font-weight: bold; cursor: pointer; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">✕</button>
          <div class="products-grid--expanded" style="display: block;">
            ${createProductCardExpanded({ ...rawProduct, isFav: favSet.has(lotId), foto: `assets/images/login/${rawProduct.foto}` })}
          </div>
        </div>
      `;
      expandedOverlay.style.display = 'flex';
    }
  });

  // ── Contraofertar modal Init ───────────────────────────────────────────
  const modalEl   = injectModal();
  const bsModal   = new bootstrap.Modal(modalEl);
  const mcName    = modalEl.querySelector('#mc-product-name');
  const mcMonto   = modalEl.querySelector('#mc-monto');
  const mcComent  = modalEl.querySelector('#mc-comentario');
  const mcConfirm = modalEl.querySelector('#mc-confirmar');
  let activeLotId = null;

  mcConfirm.addEventListener('click', async () => {
    const monto = parseFloat(mcMonto.value);
    if (!monto || monto <= 0) { mcMonto.focus(); return; }
    if (!userId) return;

    mcConfirm.disabled    = true;
    mcConfirm.textContent = 'Enviando…';
    try {
      await NegociacionesService.iniciar({
        id_lote:      activeLotId,
        id_comprador: userId,
        monto,
        comentario:   mcComent.value.trim() || null,
      });
      bsModal.hide();
      toastSuccess('Negociación iniciada correctamente.');
    } catch (err) {
      toastError('No se pudo iniciar la negociación.');
      console.error(err);
    } finally {
      mcConfirm.disabled    = false;
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
import { userCache, updateFavoritos } from '../../user.js';
import { createSearchBar } from '../../../../../../assets/js/components/chat-components.js';
import { createProductCard, createProductCardExpanded } from '../../../../../../assets/js/components/marketplace-components.js';
import { FavoritosService } from '../../../../../../assets/js/services/favoritos.js';
import { NegociacionesService } from '../../../../../../assets/js/services/negociaciones.js';
import { toastSuccess, toastError } from '../../../../../../assets/js/toast.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapFavorito(f) {
  return {
    id: f.id_lote,
    name: f.nombre_producto,
    vendor: f.nombre_productor,
    rating: parseFloat(f.calificacion_producto) || 0,
    price: parseFloat(f.precio_recuperacion_sugerido) || 0,
    status: f.estado_lote === 'disponible' ? 'Disponible' : 'En negociación',
    catId: f.id_categoria,
    catName: f.nombre_categoria,
    zona: f.zona || '',
    image: f.foto ? `assets/images/lotes/${f.foto}` : `assets/images/lotes/frutas.jpeg`,
    isFav: true,
  };
}

function injectModal() {
  document.getElementById('market-contraoferta-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'market-contraoferta-modal';
  modal.className = 'modal fade';
  modal.tabIndex = -1;
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

// ── Component ─────────────────────────────────────────────────────────────────

export async function init(container) {
  const userId = userCache.userId;
  const searchSlot = container.querySelector('#market-search');
  const productsGrid = container.querySelector('#productsGrid');
  const filtersWrap = container.querySelector('.filters-wrap');
  const toggleBtn = container.querySelector('.filters-toggle');
  const filtersEl = container.querySelector('.filters');

  console.log("user caché: ", userCache);

  searchSlot.innerHTML = createSearchBar('Buscar favoritos...');
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

  let allProducts = [];
  let currentCatId = 0;
  let searchTerm = '';
  let favSet = new Set();

  // ── Populate from cache (no fetch needed) ─────────────────────────────
  userCache.favoritos.forEach(f => favSet.add(f.id_lote));
  allProducts = (userId ? userCache.favoritos : []).map(mapFavorito);

  const seenCats = new Map();
  allProducts.forEach(p => {
    if (!seenCats.has(p.catId)) seenCats.set(p.catId, p.catName);
  });
  seenCats.forEach((name, id) => {
    const btn = document.createElement('button');
    btn.className = 'filter';
    btn.dataset.catId = id;
    btn.textContent = name;
    filtersEl.appendChild(btn);
  });

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
    clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    renderProducts();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    clearBtn.style.display = 'none';
    renderProducts();
    searchInput.focus();
  });

  // ── Handlers reutilizables (Fav & Contraoferta) ────────────────────────
  // ── Handlers reutilizables (Fav & Contraoferta) ────────────────────────
  async function handleFavToggle(btn) {
    if (!userId) return;
    const lotId = parseInt(btn.dataset.id);
    const nowFav = btn.classList.toggle('active');

    // Guardamos un respaldo por si la API falla y necesitamos revertir
    const productBackup = userCache.favoritos.find(f => f.id_lote === lotId) || allProducts.find(p => p.id === lotId);

    if (nowFav) {
      favSet.add(lotId);
      // Si el usuario lo vuelve a marcar rápido (ej. desde el overlay)
      if (productBackup && !allProducts.some(p => p.id === lotId)) {
        allProducts.push(mapFavorito(productBackup));
        renderProducts();
      }
    } else {
      favSet.delete(lotId);
      // 1. Eliminación inmediata del arreglo local
      allProducts = allProducts.filter(p => p.id !== lotId);

      // 2. Refrescar la cuadrícula al instante
      renderProducts();
      // 3. (Opcional) Si tenía el overlay abierto viendo ese producto, lo cerramos
      if (expandedOverlay.style.display === 'flex') {
        expandedOverlay.style.display = 'none';
      }
    }

    try {
      // Mandamos la petición al servidor en segundo plano
      await FavoritosService.toggleFavorito(userId, lotId);
      updateFavoritos();
    } catch (err) {
      // Revertir cambios visuales si el servidor da error
      btn.classList.toggle('active');
      if (nowFav) {
        favSet.delete(lotId);
      } else {
        favSet.add(lotId);
        if (productBackup) {
          allProducts.push(mapFavorito(productBackup));
          renderProducts();
        }
      }
      console.error('Error toggling favorito:', err);
      toastError('Error de conexión. Se revirtió el cambio.');
    }
  }

  function handleContraoferta(btn) {
    const lotId = parseInt(btn.dataset.id);
    const product = allProducts.find(p => p.id === lotId);
    if (!product) return;

    activeLotId = lotId;
    mcName.textContent = product.name;
    mcMonto.value = '';
    mcComent.value = '';
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
    if (e.target === expandedOverlay || e.target.closest('.mc-close-btn')) {
      expandedOverlay.style.display = 'none';
      return;
    }

    const favBtn = e.target.closest('.product-fav-btn');
    if (favBtn) handleFavToggle(favBtn);

    const ctaBtn = e.target.closest('.product-cta-btn');
    if (ctaBtn) {
      expandedOverlay.style.display = 'none';
      handleContraoferta(ctaBtn);
    }
  });

  // ── Contraofertar modal Init ───────────────────────────────────────────
  const modalEl = injectModal();
  const bsModal = new bootstrap.Modal(modalEl);
  const mcName = modalEl.querySelector('#mc-product-name');
  const mcMonto = modalEl.querySelector('#mc-monto');
  const mcComent = modalEl.querySelector('#mc-comentario');
  const mcConfirm = modalEl.querySelector('#mc-confirmar');
  let activeLotId = null;

  mcConfirm.addEventListener('click', async () => {
    const monto = parseFloat(mcMonto.value);
    if (!monto || monto <= 0) { mcMonto.focus(); return; }
    if (!userId) return;

    mcConfirm.disabled = true;
    mcConfirm.textContent = 'Enviando…';
    try {
      await NegociacionesService.iniciar({
        id_lote: activeLotId,
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

      // Fallback search: checking both lotes and favoritos arrays to guarantee the product is found
      const rawProduct = userCache.lotes?.find(l => l.id_lote === lotId) || userCache.favoritos.find(f => f.id_lote === lotId);
      if (!rawProduct) return;

      expandedOverlay.innerHTML = `
        <div style="position: relative; max-width: 600px; width: 100%; border-radius: 14px; background: #fff; max-height: 90vh; overflow-y: auto;">
          <button class="mc-close-btn" style="position: absolute; top: 12px; right: 12px; background: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; font-weight: bold; cursor: pointer; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">✕</button>
          <div class="products-grid--expanded" style="display: block;">
            ${createProductCardExpanded({ ...rawProduct, isFav: favSet.has(lotId), foto: `assets/images/lotes/${rawProduct.foto}` })}
          </div>
        </div>
      `;
      expandedOverlay.style.display = 'flex';
    }
  });

  // ── Render ─────────────────────────────────────────────────────────────
  function renderProducts() {
    const term = searchTerm.toLowerCase();

    const filtered = allProducts.filter(p => {
      const matchCat = currentCatId === 0 || p.catId === currentCatId;
      const matchSearch = p.name.toLowerCase().includes(term)
        || p.vendor.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    productsGrid.innerHTML = filtered.length
      ? filtered.map(p => createProductCard(p)).join('')
      : '<p class="market-empty">No tienes favoritos guardados.</p>';
  }
}
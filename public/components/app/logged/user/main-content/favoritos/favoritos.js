import { createSearchBar }   from '../../../../../../assets/js/components/chat-components.js';
import { createProductCard } from '../../../../../../assets/js/components/marketplace-components.js';
import { FavoritosService }  from '../../../../../../assets/js/services/favoritos.js';
import { toastSuccess }      from '../../../../../../assets/js/toast.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapFavorito(f) {
  return {
    id:      f.id_lote,
    name:    f.nombre_producto,
    vendor:  f.nombre_productor,
    rating:  parseFloat(f.calificacion_producto) || 0,
    price:   parseFloat(f.precio_recuperacion_sugerido) || 0,
    status:  f.estado_lote === 'disponible' ? 'Disponible' : 'En negociación',
    catId:   f.id_categoria,
    catName: f.nombre_categoria,
    zona:    f.zona || '',
    image:   'assets/images/login/frutas.jpeg',
    isFav:   true,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export async function init(container) {
  const userId       = parseInt(localStorage.getItem('token'), 10) || null;
  const searchSlot   = container.querySelector('#market-search');
  const productsGrid = container.querySelector('#productsGrid');
  const filtersWrap  = container.querySelector('.filters-wrap');
  const toggleBtn    = container.querySelector('.filters-toggle');
  const filtersEl    = container.querySelector('.filters');

  searchSlot.innerHTML = createSearchBar('Buscar favoritos...');
  const searchInput = searchSlot.querySelector('.chat-search-bar__input');

  let allProducts  = [];
  let currentCatId = 0;
  let searchTerm   = '';

  // ── Skeleton ───────────────────────────────────────────────────────────
  productsGrid.innerHTML = Array(4).fill(
    '<div class="product-card product-card--skeleton"></div>'
  ).join('');

  // ── Load favorites ─────────────────────────────────────────────────────
  try {
    const favs  = userId ? await FavoritosService.getFavoritos(userId) : [];
    allProducts = favs.map(mapFavorito);

    // Build category filter buttons from the unique categories in this user's favorites
    const seenCats = new Map();
    allProducts.forEach(p => {
      if (!seenCats.has(p.catId)) seenCats.set(p.catId, p.catName);
    });
    seenCats.forEach((name, id) => {
      const btn = document.createElement('button');
      btn.className     = 'filter';
      btn.dataset.catId = id;
      btn.textContent   = name;
      filtersEl.appendChild(btn);
    });

    renderProducts();
  } catch (err) {
    console.error('Error cargando favoritos:', err);
    productsGrid.innerHTML = '<p class="market-empty">No se pudieron cargar los favoritos.</p>';
  }

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

  // ── Fav button → remove from favorites ────────────────────────────────
  productsGrid.addEventListener('click', async e => {
    const btn = e.target.closest('.product-fav-btn');
    if (!btn || !userId) return;

    const lotId   = parseInt(btn.dataset.id);
    const product = allProducts.find(p => p.id === lotId);

    // Optimistic: drop from list and re-render immediately
    allProducts = allProducts.filter(p => p.id !== lotId);
    renderProducts();
    toastSuccess(`"${product?.name}" eliminado de favoritos.`);

    try {
      await FavoritosService.toggleFavorito(userId, lotId);
    } catch (err) {
      // Revert on API failure
      if (product) allProducts.push(product);
      renderProducts();
      console.error('Error eliminando favorito:', err);
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
      ? filtered.map(p => createProductCard(p)).join('')
      : '<p class="market-empty">No tienes favoritos guardados.</p>';
  }
}

const ESTADO_LABELS = {
  disponible:     'Disponible',
  en_negociacion: 'En negociación',
  asignado:       'Asignado',
  caducado:       'Caducado',
};

const LOTE_ESTADOS = Object.keys(ESTADO_LABELS);

const LOCATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

const EDIT_ICON   = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const DELETE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

/**
 * Lote card for the farmer's "Mis Lotes" grid.
 * @param {{ id, image, name, categoria, price, estado, cantidad, fecha }} lote
 */
export function createLoteCard({ id = '', image = '', name = '', categoria = '', price = 0, estado = 'disponible', cantidad = 0, fecha = '' }) {
  const priceStr  = typeof price === 'number' ? `$${price.toFixed(2)}` : price;
  const selectOpts = LOTE_ESTADOS.map(e =>
    `<option value="${e}"${e === estado ? ' selected' : ''}>${ESTADO_LABELS[e]}</option>`
  ).join('');

  return `
    <article class="product-card" data-id="${id}">
      <div class="product-image-cont">
        <img class="product-image" src="${image}" alt="${name}">
      </div>
      <div class="product-content">
        <h3 class="product-name">${name}</h3>
        <p class="product-vendor">${categoria}</p>
        <p class="product-vendor">${cantidad} kg &middot; ${fecha}</p>
        <div class="product-row">
          <span class="product-price">${priceStr}</span>
          <select class="lote-estado-select" data-id="${id}" data-prev="${estado}">
            ${selectOpts}
          </select>
        </div>
        <div class="lote-actions-row">
          <button class="lote-editar-btn" data-id="${id}">Editar</button>
          <button class="lote-eliminar-btn" data-id="${id}">Eliminar</button>
        </div>
      </div>
    </article>
  `;
}

function renderStars(rating) {
  const full  = Math.round(rating);
  const empty = 5 - full;
  return `<span class="product-rating__stars">${'★'.repeat(full)}${'☆'.repeat(empty)}</span>
          <span class="product-rating__value">${rating}</span>`;
}

/**
 * Product card for the admin productos grid.
 * Shows edit and delete action buttons instead of the marketplace "Contraofertar".
 * @param {{ id, image, name, vendor, rating, price, status, zona, estado }} product
 */
export function createAdminProductCard({ id = '', image = '', name = '', vendor = '', rating = 0, price = 0, status = 'Disponible', zona = '', estado = 'disponible' }) {
  const statusMod = status === 'Disponible' ? 'product-status--active' : 'product-status--inactive';
  const priceStr  = typeof price === 'number' ? `$${price.toFixed(2)}` : price;

  return `
    <article class="product-card" data-id="${id}">
      <div class="product-image-cont">
        <img class="product-image" src="${image}" alt="${name}">
      </div>
      <div class="product-content">
        <h3 class="product-name">${name}</h3>
        <p class="product-vendor">${vendor}</p>
        <div class="product-rating">${renderStars(rating)}</div>
        <p class="product-zona">${LOCATION_ICON} ${zona || 'Sin zona'}</p>
        <div class="product-row">
          <span class="product-price">${priceStr}</span>
          <span class="product-status ${statusMod}">${status}</span>
        </div>
        <div class="admin-prod-actions-row">
          <button class="admin-prod-edit-btn" data-id="${id}" data-name="${name}" data-price="${price}" data-estado="${estado}" aria-label="Editar">
            ${EDIT_ICON} Editar
          </button>
          <button class="admin-prod-delete-btn" data-id="${id}" data-name="${name}" aria-label="Eliminar">
            ${DELETE_ICON} Eliminar
          </button>
        </div>
      </div>
    </article>
  `;
}
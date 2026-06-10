const FAV_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

const LOCATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

function renderStars(rating) {
  const full  = Math.round(rating);
  const empty = 5 - full;
  return `<span class="product-rating__stars">${'★'.repeat(full)}${'☆'.repeat(empty)}</span>
          <span class="product-rating__value">${rating}</span>`;
}

/**
 * Product card for the marketplace grid.
 * @param {{ id, image, name, vendor, rating, price, status }} product
 */
export function createProductCard({ id = '', image = '', name = '', vendor = '', rating = 0, price = 0, status = 'Activo', zona = '', isFav = false }) {
  const statusMod = status === 'Disponible' ? 'product-status--active' : 'product-status--inactive';
  const priceStr  = typeof price === 'number' ? `$${price.toFixed(2)}` : price;

  return `
    <article class="product-card" data-id="${id}">
      <div class="product-image-cont">
        <img class="product-image" src="${image}" alt="${name}">
        <button class="product-fav-btn${isFav ? ' active' : ''}" data-id="${id}" aria-label="Agregar a favoritos">
          ${FAV_ICON}
        </button>
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
        <button class="product-cta-btn" data-id="${id}">Contraofertar</button>
      </div>
    </article>
  `;
}

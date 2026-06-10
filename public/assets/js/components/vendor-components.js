const AVATAR_COLORS = [
  '#1B853F', '#00796B', '#85B72C', '#2980B9',
  '#8E44AD', '#C0392B', '#D35400', '#16A085',
];

const LOCATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

function renderStars(rating) {
  const full  = Math.round(rating);
  const empty = 5 - full;
  return `<span class="vendor-rating__stars">${'★'.repeat(full)}${'☆'.repeat(empty)}</span>
          <span class="vendor-rating__value">${Number(rating).toFixed(1)}</span>`;
}

/**
 * Vendor card for the catalogo-vendedores grid.
 * @param {{ id, name, rating, zona, mainProduct }} vendor
 */
export function createVendorCard({ id = 0, name = '', rating = 0, zona = '', mainProduct = '' }) {
  const initial = (name || '?')[0].toUpperCase();
  const color   = AVATAR_COLORS[id % AVATAR_COLORS.length];

  return `
    <article class="vendor-card" data-id="${id}">
      <div class="vendor-avatar-cont" style="background-color:${color}">
        <span class="vendor-avatar__letter">${initial}</span>
      </div>
      <div class="vendor-content">
        <h3 class="vendor-name">${name}</h3>
        ${mainProduct ? `<p class="vendor-product">${mainProduct}</p>` : '<p class="vendor-product">—</p>'}
        <div class="vendor-rating">${renderStars(rating)}</div>
        <p class="vendor-zona">${LOCATION_ICON} ${zona || 'Sin zona'}</p>
        <button class="vendor-cta-btn" data-id="${id}">Ver productos</button>
      </div>
    </article>
  `;
}

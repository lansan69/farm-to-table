const FAV_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

const ESTADO_LABELS = {
  disponible:     'Disponible',
  en_negociacion: 'En negociación',
  asignado:       'Asignado',
  caducado:       'Caducado',
};

const LOTE_ESTADOS = Object.keys(ESTADO_LABELS);

const LOCATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

function renderStars(rating) {
  const full  = Math.round(rating);
  const empty = 5 - full;
  return `<span class="product-rating__stars">${'★'.repeat(full)}${'☆'.repeat(empty)}</span>
          <span class="product-rating__value">${rating}</span>`;
}

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

export function createProductCardExpanded(data) {
  // Desestructuramos con valores por defecto para evitar errores con nulls
  const {
    id_lote = '',
    foto = '',
    nombre_producto = 'Sin nombre',
    nombre_productor = 'Productor desconocido',
    calificacion_producto = 0,
    calificacion_vendedor = '0.00',
    precio_recuperacion_sugerido = '0',
    estado_lote = 'disponible',
    cantidad_kg = '0',
    fecha_cosecha = '',
    vida_util_dias = 0,
    nombre_categoria = '',
    descripcion_producto = '',
    telefono_productor = '',
    email_productor = '',
    zona = '',
    isFav = false
  } = data;

  const statusMod = estado_lote === 'disponible' ? 'product-status--active' : 'product-status--inactive';
  const priceStr = `$${parseFloat(precio_recuperacion_sugerido).toFixed(2)}`;
  const kgStr = `${parseFloat(cantidad_kg).toFixed(2)} kg`;
  
  // Manejo de nulos en calificaciones
  const ratingProd = calificacion_producto !== null ? calificacion_producto : 0;

  return `
    <article class="product-card product-card--expanded" data-id="${id_lote}">
      <div class="product-image-cont">
        <img class="product-image" src="${foto || 'assets/img/default-product.jpg'}" alt="${nombre_producto}">
        <button class="product-fav-btn${isFav ? ' active' : ''}" data-id="${id_lote}" aria-label="Agregar a favoritos">
          ${FAV_ICON}
        </button>
      </div>
      
      <div class="product-content">
        <div class="product-header">
          <h3 class="product-name">${nombre_producto}</h3>
          <span class="product-status ${statusMod}">${estado_lote}</span>
        </div>
        
        <p class="product-vendor">${nombre_productor} <span class="vendor-rating">⭐ ${parseFloat(calificacion_vendedor).toFixed(1)}</span></p>
        <p class="product-category">${nombre_categoria}</p>

        ${descripcion_producto ? `<p class="product-desc">${descripcion_producto}</p>` : ''}

        <div class="product-details-grid">
          <div class="detail-item"><strong>Cantidad:</strong> ${kgStr}</div>
          <div class="detail-item"><strong>Cosecha:</strong> ${fecha_cosecha}</div>
          <div class="detail-item"><strong>Vida útil:</strong> ${vida_util_dias} días</div>
          <div class="detail-item"><strong>Calidad:</strong> ${renderStars(ratingProd)}</div>
        </div>

        <div class="product-contact">
          <p>📞 ${telefono_productor}</p>
          <p>✉️ ${email_productor}</p>
          <p class="product-zona">${LOCATION_ICON} ${zona || 'Zona no especificada'}</p>
        </div>

        <div class="product-row">
          <span class="product-price">${priceStr}</span>
        </div>
        
        <button class="product-cta-btn" data-id="${id_lote}">Contraofertar</button>
      </div>
    </article>
  `;
}
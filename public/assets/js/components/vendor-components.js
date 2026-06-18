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
export function createVendorCard({ id = 0, name = '', rating = 0, zona = '', mainProduct = '', foto = null }) {
  const initial = (name || '?')[0].toUpperCase();
  const color   = AVATAR_COLORS[id % AVATAR_COLORS.length];

  // Lógica para mostrar foto o inicial
  const avatarContent = foto 
    ? `<img src="../assets/images/users/${foto}" style="width:100%; height:100%; object-fit:cover;" />`
    : `<span class="vendor-avatar__letter">${initial}</span>`;
    
  const avatarStyle = foto ? `background-color: transparent;` : `background-color: ${color};`;

  return `
    <article class="vendor-card" data-id="${id}">
      <div class="vendor-avatar-cont" style="${avatarStyle}">
        ${avatarContent}
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

/**
 * Vendor expanded card handling detailed profile information.
 * @param {Object} data - Datos combinados de las tablas usuarios y zonas
 */
export function createVendorCardExpanded(data = {}) {
  const {
    id_usuario = 0,
    nombre_razon_social = 'Sin nombre',
    apellido = '',
    email = 'Sin correo electrónico',
    telefono_contacto = 'Sin teléfono',
    puntuacion_promedio = 0,
    fecha_registro = '',
    zona = 'Sin zona',
    codigo_postal = '',
    rol_usuario = 'productor',
    foto = null
  } = data;

  const fullName = apellido ? `${nombre_razon_social} ${apellido}` : nombre_razon_social;
  const initial = (nombre_razon_social || '?')[0].toUpperCase();
  const color = AVATAR_COLORS[id_usuario % AVATAR_COLORS.length] || '#1B853F';
  
  const joinedDate = fecha_registro ? fecha_registro.split(' ')[0] : 'Desconocida';
  const zonaStr = codigo_postal ? `${zona}, C.P. ${codigo_postal}` : zona;

  // Lógica de avatar: Imagen o Inicial
  const avatarContent = foto 
    ? `<img src="../assets/images/users/${foto}" style="width:100%; height:100%; object-fit:cover;" />`
    : initial;

  const avatarStyle = foto 
    ? `background-color: transparent;` 
    : `background-color: ${color};`;
  
  return `
    <article class="card border-0 rounded-4 w-100 shadow-sm overflow-hidden vendor-card--expanded" data-id="${id_usuario}">
      <div class="card-body p-4 p-md-5">
        
        <div class="d-flex align-items-center gap-3 mb-4">
          <div class="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0 overflow-hidden" 
               style="${avatarStyle} width: 70px; height: 70px; font-size: 2rem; font-weight: bold;">
            ${avatarContent}
          </div>
          <div class="overflow-hidden">
            <h3 class="h4 mb-1 fw-bold text-dark text-truncate" title="${fullName}">${fullName}</h3>
            <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 text-capitalize px-2 py-1">
              ${rol_usuario}
            </span>
          </div>
        </div>
        
        <div class="vendor-rating mb-4 fs-5 text-warning">
          ${renderStars(puntuacion_promedio)}
        </div>
        
        <div class="row g-3 mb-4 text-secondary" style="font-size: 0.95rem;">
          <div class="col-6">
            <div class="fw-semibold text-dark mb-1">📞 Teléfono</div>
            <div class="text-truncate" title="${telefono_contacto}">${telefono_contacto}</div>
          </div>
          <div class="col-6">
            <div class="fw-semibold text-dark mb-1">📧 Email</div>
            <div class="text-truncate" title="${email}">${email}</div>
          </div>
          <div class="col-6">
            <div class="fw-semibold text-dark mb-1">${LOCATION_ICON} Zona</div>
            <div class="text-truncate" title="${zonaStr}">${zonaStr}</div>
          </div>
          <div class="col-6">
            <div class="fw-semibold text-dark mb-1">📅 Registro</div>
            <div>${joinedDate}</div>
          </div>
        </div>
        
        <div class="d-flex gap-2 mt-2">
          <button class="btn text-white w-100 fw-semibold rounded-3 vendor-cta-btn" data-id="${id_usuario}" 
                  style="background-color: var(--color-teal);">
            Ver productos
          </button>
        </div>

      </div>
    </article>
  `;
}
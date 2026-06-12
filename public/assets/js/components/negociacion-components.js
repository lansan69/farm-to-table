const AVATAR_COLORS = [
  '#1B853F', '#00796B', '#85B72C', '#2980B9',
  '#8E44AD', '#C0392B', '#D35400', '#16A085',
];

const LOCATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

const ESTADO_LABELS = {
  pendiente:               'Pendiente',
  contraoferta_productor:  'Contraoferta',
  aceptada:                'Aceptada',
  rechazada:               'Rechazada',
};

const ESTADO_MODS = {
  pendiente:               'negoc-estado--pending',
  contraoferta_productor:  'negoc-estado--counter',
  aceptada:                'negoc-estado--accepted',
  rechazada:               'negoc-estado--rejected',
};

/**
 * Negotiation card for the contraofertas grid.
 * @param {{ id, idLote, nombre, vendedor, zona, precioOfertado, precioReal, estado }} neg
 */
export function createNegociacionCard({
  id          = 0,
  idLote      = 0,
  nombre      = '',
  vendedor    = '',
  zona        = '',
  precioOfertado = 0,
  precioReal     = 0,
  estado      = 'pendiente',
  comentario  = '',
  mode        = 'comprador',   // 'comprador' | 'productor'
}) {
  const initial    = (nombre || '?')[0].toUpperCase();
  const color      = AVATAR_COLORS[idLote % AVATAR_COLORS.length];
  const estadoLbl  = ESTADO_LABELS[estado] ?? estado;
  const estadoMod  = ESTADO_MODS[estado]   ?? '';
  const fmt        = (n) => `$${Number(n).toFixed(2)}`;
  const isTerminal = ['aceptada', 'rechazada'].includes(estado);
  const dis        = isTerminal ? 'disabled' : '';

  const actionsHtml = mode === 'productor'
    ? `<button class="negoc-btn negoc-btn--msg"    data-id="${id}" ${dis}>Enviar mensaje</button>
       <button class="negoc-btn negoc-btn--reject"  data-id="${id}" ${dis}>Rechazar</button>
       <button class="negoc-btn negoc-btn--accept"  data-id="${id}" ${dis}>Aceptar</button>`
    : `<button class="negoc-btn negoc-btn--msg"    data-id="${id}" ${dis}>Enviar mensaje</button>
       <button class="negoc-btn negoc-btn--edit"   data-id="${id}" ${dis}>Modificar oferta</button>`;

  return `
    <article class="negoc-card" data-id="${id}">
      <div class="negoc-avatar-cont" style="background-color:${color}">
        <span class="negoc-avatar__letter">${initial}</span>
      </div>
      <div class="negoc-content">
        <h3 class="negoc-name">${nombre}</h3>
        <p class="negoc-vendor">${vendedor}</p>
        <p class="negoc-zona">${LOCATION_ICON} ${zona || 'Sin zona'}</p>
        <div class="negoc-row">
          <div class="negoc-price-block">
            <span class="negoc-price-label">Oferta actual</span>
            <span class="negoc-price-value negoc-price-value--offer">${fmt(precioOfertado)}</span>
          </div>
          <div class="negoc-price-block">
            <span class="negoc-price-label">Precio real</span>
            <span class="negoc-price-value">${fmt(precioReal)}</span>
          </div>
          <span class="negoc-estado ${estadoMod}">${estadoLbl}</span>
        </div>
        <p class="negoc-comment">${comentario || '<span class="negoc-comment--empty">Sin comentario</span>'}</p>
        <div class="negoc-actions">
          ${actionsHtml}
        </div>
      </div>
    </article>
  `;
}

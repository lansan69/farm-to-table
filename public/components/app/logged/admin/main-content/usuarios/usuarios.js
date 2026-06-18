import { adminCache } from '../../../admin/admin.js';

const ROL_META = {
  usuario:      { label: 'Usuario',      bg: '#e8f0fe', fg: '#1a56db' },
  productor:    { label: 'Productor',    bg: '#e8f5ec', fg: '#1B853F' },
  organizacion: { label: 'Organización', bg: '#fef3c7', fg: '#92400e' },
  admin:        { label: 'Admin',        bg: '#fce7f3', fg: '#be185d' },
};

let allUsers    = [];
let activeRol   = 'todos';
let searchTerm  = '';
let bsModal     = null;

export function init(container) {
  allUsers = adminCache.usuarios;

  const sub = container.querySelector('#uSub');
  if (sub) sub.textContent = `${allUsers.length} usuario${allUsers.length !== 1 ? 's' : ''} en el sistema`;

  setupSearch(container);
  setupTabs(container);
  renderTable(container);
  setupModal(container);
}

export function cleanup() {
  if (bsModal) { bsModal.dispose(); bsModal = null; }
}

// ── Search ─────────────────────────────────────────────────────────────────────

function setupSearch(container) {
  const input = container.querySelector('#uSearch');
  input?.addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderTable(container);
  });
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

function setupTabs(container) {
  const tabs = container.querySelector('#roleTabs');
  tabs?.addEventListener('click', e => {
    const tab = e.target.closest('.role-tab');
    if (!tab) return;
    tabs.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeRol = tab.dataset.rol;
    renderTable(container);
  });
}

// ── Table ──────────────────────────────────────────────────────────────────────

function renderTable(container) {
  const tbody  = container.querySelector('#uTableBody');
  const emptyEl = container.querySelector('#uEmpty');

  const filtered = allUsers.filter(u => {
    const matchRol = activeRol === 'todos' || u.rol_usuario === activeRol;
    const nombre   = `${u.nombre_razon_social || ''} ${u.apellido || ''}`.toLowerCase();
    const email    = (u.email || '').toLowerCase();
    const matchSearch = !searchTerm || nombre.includes(searchTerm) || email.includes(searchTerm);
    return matchRol && matchSearch;
  });

  if (!filtered.length) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  tbody.innerHTML = filtered.map(u => buildRow(u)).join('');
}

function buildRow(u) {
  const nombre  = `${u.nombre_razon_social || ''} ${u.apellido || ''}`.trim() || 'Sin nombre';
  const inicial = nombre.charAt(0).toUpperCase();
  const meta    = ROL_META[u.rol_usuario] || { label: u.rol_usuario, bg: '#f0f0f0', fg: '#666' };
  const zona    = u.nombre_delegacion || '—';
  const tel     = u.telefono_contacto || '—';
  const fecha   = u.fecha_registro
    ? new Date(u.fecha_registro).toLocaleDateString('es-MX')
    : '—';

  return `
    <tr data-id="${u.id_usuario}">
      <td>
        <div class="u-name-cell">
          <div class="u-avatar-sm" style="background:${meta.bg};color:${meta.fg}">${inicial}</div>
          <div class="u-name-wrap">
            <span class="u-fullname">${nombre}</span>
            <span class="u-email">${u.email || ''}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="u-rol-badge" style="background:${meta.bg};color:${meta.fg}">${meta.label}</span>
      </td>
      <td>${zona}</td>
      <td>${tel}</td>
      <td>${fecha}</td>
      <td>
        <button class="u-ver-btn" data-id="${u.id_usuario}" aria-label="Ver detalle">Ver</button>
      </td>
    </tr>`;
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function setupModal(container) {
  const modalEl = document.getElementById('userDetailModal');
  if (!modalEl) return;

  bsModal = new bootstrap.Modal(modalEl);

  container.querySelector('#uTableBody')?.addEventListener('click', e => {
    const btn = e.target.closest('.u-ver-btn');
    const row = e.target.closest('tr[data-id]');
    if (!btn && !row) return;

    const id = parseInt((btn || row).dataset.id);
    const u  = allUsers.find(x => x.id_usuario === id);
    if (u) populateModal(u);
    bsModal.show();
  });
}

function populateModal(u) {
  const nombre  = `${u.nombre_razon_social || ''} ${u.apellido || ''}`.trim() || 'Sin nombre';
  const inicial = nombre.charAt(0).toUpperCase();
  const meta    = ROL_META[u.rol_usuario] || { label: u.rol_usuario, bg: '#f0f0f0', fg: '#666' };

  document.getElementById('udAvatar').textContent  = inicial;
  document.getElementById('udAvatar').style.background = meta.bg;
  document.getElementById('udAvatar').style.color      = meta.fg;
  document.getElementById('udName').textContent    = nombre;

  const badge = document.getElementById('udRoleBadge');
  badge.textContent       = meta.label;
  badge.style.background  = meta.bg;
  badge.style.color       = meta.fg;

  const fecha  = u.fecha_registro
    ? new Date(u.fecha_registro).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const zona   = u.nombre_delegacion ? `${u.nombre_delegacion} (${u.codigo_postal || ''})` : '—';
  const rating = parseFloat(u.puntuacion_promedio) || 0;
  const stars  = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  document.getElementById('udBody').innerHTML = `
    ${infoRow('Correo',     u.email || '—',         emailIcon())}
    ${infoRow('Teléfono',   u.telefono_contacto || '—', phoneIcon())}
    ${infoRow('Zona',       zona,                   locationIcon())}
    ${infoRow('Registro',   fecha,                  calIcon())}
    ${infoRow('Puntuación', `${stars} ${rating.toFixed(1)}`, starIcon())}
    ${u.id_zona ? infoRow('ID zona', u.id_zona, '') : ''}
  `;
}

// ── Icon helpers ───────────────────────────────────────────────────────────────

const infoRow = (lbl, val, icon) => `
  <div class="ud-row">
    <span class="ud-row-icon">${icon}</span>
    <span class="ud-row-lbl">${lbl}</span>
    <span class="ud-row-val">${val}</span>
  </div>`;

const emailIcon    = () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/></svg>`;
const phoneIcon    = () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/></svg>`;
const locationIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>`;
const calIcon      = () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/></svg>`;
const starIcon     = () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187z"/></svg>`;

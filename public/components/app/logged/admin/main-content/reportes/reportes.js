import { adminCache } from '../../../admin/admin.js';

const SITU_META = {
  pendiente:   { label: 'Pendiente',   cls: 'r-situ--pendiente'   },
  en_revision: { label: 'En revisión', cls: 'r-situ--en_revision' },
  resuelto:    { label: 'Resuelto',    cls: 'r-situ--resuelto'    },
  cerrado:     { label: 'Cerrado',     cls: 'r-situ--cerrado'     },
};

let allReportes  = [];
let activeSitu   = 'todos';
let searchTerm   = '';
let detailModal  = null;

export function init(container) {
  allReportes = adminCache.reportes;

  const sub = container.querySelector('#rSub');
  if (sub) sub.textContent = `${allReportes.length} reporte${allReportes.length !== 1 ? 's' : ''} en el sistema`;

  setupSearch(container);
  setupTabs(container);
  renderTable(container);
  setupModal(container);
}

export function cleanup() {
  if (detailModal) { detailModal.dispose(); detailModal = null; }
}

// ── Search ─────────────────────────────────────────────────────────────────────

function setupSearch(container) {
  const input = container.querySelector('#rSearch');
  input?.addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderTable(container);
  });
}

// ── Situación tabs ─────────────────────────────────────────────────────────────

function setupTabs(container) {
  const tabs = container.querySelector('#rTabs');
  tabs?.addEventListener('click', e => {
    const tab = e.target.closest('.r-tab');
    if (!tab) return;
    tabs.querySelectorAll('.r-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeSitu = tab.dataset.situ;
    renderTable(container);
  });
}

// ── Table ──────────────────────────────────────────────────────────────────────

function renderTable(container) {
  const tbody   = container.querySelector('#rTableBody');
  const emptyEl = container.querySelector('#rEmpty');

  const filtered = allReportes.filter(r => {
    const matchSitu   = activeSitu === 'todos' || r.situacion === activeSitu;
    const reporta     = (r.nombre_reporta    || '').toLowerCase();
    const reportado   = (r.nombre_reportado  || '').toLowerCase();
    const matchSearch = !searchTerm || reporta.includes(searchTerm) || reportado.includes(searchTerm);
    return matchSitu && matchSearch;
  });

  if (!filtered.length) {
    tbody.innerHTML       = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  tbody.innerHTML = filtered.map(r => buildRow(r)).join('');
}

function buildRow(r) {
  const meta  = SITU_META[r.situacion] || { label: r.situacion, cls: 'r-situ--cerrado' };
  const fecha = r.fecha_reporte
    ? new Date(r.fecha_reporte).toLocaleDateString('es-MX')
    : '—';

  const reporta   = r.nombre_reporta   || `Usuario #${r.id_usuario_reporta}`;
  const reportado = r.nombre_reportado || `Usuario #${r.id_usuario_reportado}`;
  const initA     = reporta.charAt(0).toUpperCase();
  const initB     = reportado.charAt(0).toUpperCase();

  return `
    <tr data-id="${r.id}">
      <td>
        <div class="r-user-pair">
          <div class="r-user-avatar" style="background:#e8f0fe;color:#1a56db">${initA}</div>
          <span class="r-user-name">${reporta}</span>
        </div>
      </td>
      <td>
        <div class="r-user-pair">
          <div class="r-user-avatar" style="background:#fce7f3;color:#be185d">${initB}</div>
          <span class="r-user-name">${reportado}</span>
        </div>
      </td>
      <td>
        <span class="r-situ-badge ${meta.cls}">${meta.label}</span>
      </td>
      <td>${fecha}</td>
      <td>
        <button class="r-ver-btn" data-id="${r.id}" aria-label="Ver detalle">Ver</button>
      </td>
    </tr>`;
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function setupModal(container) {
  const modalEl = document.getElementById('reporteDetailModal');
  if (!modalEl) return;

  detailModal = new bootstrap.Modal(modalEl);

  container.querySelector('#rTableBody')?.addEventListener('click', e => {
    const btn = e.target.closest('.r-ver-btn');
    const row = e.target.closest('tr[data-id]');
    if (!btn && !row) return;

    const id = parseInt((btn || row).dataset.id);
    const r  = allReportes.find(x => x.id === id);
    if (r) populateModal(r);
    detailModal.show();
  });
}

function populateModal(r) {
  const meta  = SITU_META[r.situacion] || { label: r.situacion, cls: 'r-situ--cerrado' };
  const fecha = r.fecha_reporte
    ? new Date(r.fecha_reporte).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const reporta   = r.nombre_reporta   || `Usuario #${r.id_usuario_reporta}`;
  const reportado = r.nombre_reportado || `Usuario #${r.id_usuario_reportado}`;

  document.getElementById('rDetailBody').innerHTML = `
    <div class="rd-row">
      <span class="rd-lbl">Situación</span>
      <span class="rd-val">
        <span class="r-situ-badge ${meta.cls}">${meta.label}</span>
      </span>
    </div>
    <div class="rd-row">
      <span class="rd-lbl">Reportante</span>
      <span class="rd-val">${reporta}</span>
    </div>
    <div class="rd-row">
      <span class="rd-lbl">Reportado</span>
      <span class="rd-val">${reportado}</span>
    </div>
    <div class="rd-row">
      <span class="rd-lbl">Fecha</span>
      <span class="rd-val">${fecha}</span>
    </div>
    ${r.chat_id ? `
    <div class="rd-row">
      <span class="rd-lbl">Chat ID</span>
      <span class="rd-val">#${r.chat_id}</span>
    </div>` : ''}
    ${r.id ? `
    <div class="rd-row">
      <span class="rd-lbl">ID reporte</span>
      <span class="rd-val">#${r.id}</span>
    </div>` : ''}
  `;
}

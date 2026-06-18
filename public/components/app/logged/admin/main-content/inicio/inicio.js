import { adminCache } from '../../../admin/admin.js';
import { navigate }   from '../../../../../../assets/js/app.js';

const SITUACION_LABELS = {
  pendiente:   'Pendiente',
  en_revision: 'En revisión',
  resuelto:    'Resuelto',
  cerrado:     'Cerrado',
};

const SITUACION_BADGE = {
  pendiente:   'badge-pending',
  en_revision: 'badge-review',
  resuelto:    'badge-resolved',
  cerrado:     'badge-closed',
};

const ROL_COLORS = {
  usuario:      { bg: '#e8f0fe', fg: '#1a56db' },
  productor:    { bg: '#e8f5ec', fg: '#1B853F' },
  organizacion: { bg: '#fef3c7', fg: '#92400e' },
  admin:        { bg: '#fce7f3', fg: '#be185d' },
};

const ROL_LABELS = {
  usuario:      'Usuario',
  productor:    'Productor',
  organizacion: 'Organización',
  admin:        'Admin',
};

export function init(container) {
  const dateEl = container.querySelector('#inicioDat');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  container.querySelector('#kpiUsersVal').textContent    = adminCache.usuarios.length;
  container.querySelector('#kpiLotesVal').textContent    = adminCache.productos.length;
  container.querySelector('#kpiZonasVal').textContent    = adminCache.zonas.length;
  container.querySelector('#kpiReportesVal').textContent = adminCache.reportes.length;

  renderRecentReports(container);
  renderRecentUsers(container);

  container.querySelector('#linkReportes')?.addEventListener('click', () => navigate('/admin/reportes'));
  container.querySelector('#linkUsuarios')?.addEventListener('click', () => navigate('/admin/usuarios'));
}

export function cleanup() {}

// ── Recent reports ─────────────────────────────────────────────────────────────

function renderRecentReports(container) {
  const list   = container.querySelector('#recentReports');
  const recent = adminCache.reportes.slice(0, 5);

  if (!recent.length) {
    list.innerHTML = '<p class="widget-empty">Sin reportes.</p>';
    return;
  }

  list.innerHTML = recent.map(r => {
    const badge = SITUACION_BADGE[r.situacion] || 'badge-pending';
    const label = SITUACION_LABELS[r.situacion] || r.situacion;
    const fecha = r.fecha_reporte
      ? new Date(r.fecha_reporte).toLocaleDateString('es-MX')
      : '—';
    const de    = r.nombre_reporta    || `#${r.id_usuario_reporta}`;
    const hacia = r.nombre_reportado  || `#${r.id_usuario_reportado}`;
    return `
      <div class="widget-row">
        <div class="widget-row-main">
          <span class="widget-row-title">${de} → ${hacia}</span>
          <span class="widget-row-sub">${fecha}</span>
        </div>
        <span class="situ-badge ${badge}">${label}</span>
      </div>`;
  }).join('');
}

// ── Recent users ───────────────────────────────────────────────────────────────

function renderRecentUsers(container) {
  const list   = container.querySelector('#recentUsers');
  const recent = [...adminCache.usuarios].slice(-5).reverse();

  if (!recent.length) {
    list.innerHTML = '<p class="widget-empty">Sin usuarios.</p>';
    return;
  }

  list.innerHTML = recent.map(u => {
    const nombre  = `${u.nombre_razon_social || ''} ${u.apellido || ''}`.trim() || 'Sin nombre';
    const inicial = nombre.charAt(0).toUpperCase();
    const colors  = ROL_COLORS[u.rol_usuario] || { bg: '#f0f0f0', fg: '#666' };
    const rolLbl  = ROL_LABELS[u.rol_usuario]  || u.rol_usuario;
    const zona    = u.nombre_delegacion || 'Sin zona';
    return `
      <div class="widget-row">
        <div class="user-avatar" style="background:${colors.bg};color:${colors.fg}">${inicial}</div>
        <div class="widget-row-main">
          <span class="widget-row-title">${nombre}</span>
          <span class="widget-row-sub">${zona}</span>
        </div>
        <span class="rol-badge" style="background:${colors.bg};color:${colors.fg}">${rolLbl}</span>
      </div>`;
  }).join('');
}

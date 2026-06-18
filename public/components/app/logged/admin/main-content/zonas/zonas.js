import { adminCache }                from '../../../admin/admin.js';
import { Http }                      from '../../../../../../assets/js/http.js';
import { toastSuccess, toastError }  from '../../../../../../assets/js/toast.js';

const PIN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>`;
const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

let allZonas    = [];
let formModal   = null;
let toggleModal = null;
let pendingToggleId = null;

export async function init(container) {
  allZonas = await Http.get('zonas.php').catch(() => [...adminCache.zonas]);

  updateSubtitle(container);
  renderGrid(container);
  setupFormModal(container);
  setupToggleModal(container);

  container.querySelector('#btnNuevaZona')?.addEventListener('click', () => openFormModal(null));
}

export function cleanup() {
  if (formModal)   { formModal.dispose();   formModal   = null; }
  if (toggleModal) { toggleModal.dispose(); toggleModal = null; }
}

// ── Subtitle ───────────────────────────────────────────────────────────────────

function updateSubtitle(container) {
  const sub = container.querySelector('#zSub');
  if (sub) sub.textContent = `${allZonas.length} zona${allZonas.length !== 1 ? 's' : ''} registrada${allZonas.length !== 1 ? 's' : ''}`;
}

// ── Grid ───────────────────────────────────────────────────────────────────────

function renderGrid(container) {
  const grid = container.querySelector('#zonasGrid');
  if (!allZonas.length) {
    grid.innerHTML = '<p class="zonas-empty">No hay zonas registradas.</p>';
    return;
  }
  grid.innerHTML = allZonas.map(z => buildCard(z)).join('');
}

function buildCard(z) {
  const activa     = z.activa == 1 || z.activa === true;
  const badgeCls   = activa ? 'zona-activa-badge--active' : 'zona-activa-badge--inactive';
  const badgeLbl   = activa ? 'Activa' : 'Inactiva';
  const toggleCls  = activa ? 'z-toggle-btn--active' : 'z-toggle-btn--inactive';
  const toggleLbl  = activa ? 'Desactivar' : 'Activar';

  return `
    <div class="zona-card" data-id="${z.id_zona}">
      <div class="zona-card-head">
        <div class="zona-card-icon">${PIN_ICON}</div>
        <span class="zona-activa-badge ${badgeCls}">${badgeLbl}</span>
      </div>
      <h3 class="zona-nombre">${z.nombre_delegacion}</h3>
      <p class="zona-cp">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16"><path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 1-1 0v-3A1.5 1.5 0 0 1 1.5 0h3a.5.5 0 0 1 0 1zM11 .5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 16 1.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 1-.5-.5M.5 11a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 1 0 1h-3A1.5 1.5 0 0 1 0 14.5v-3a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 .5-.5M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8m0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/></svg>
        CP ${z.codigo_postal}
      </p>
      <div class="zona-actions">
        <button class="z-edit-btn" data-id="${z.id_zona}" aria-label="Editar zona">
          ${EDIT_ICON} Editar
        </button>
        <button class="z-toggle-btn ${toggleCls}" data-id="${z.id_zona}" aria-label="${toggleLbl}">
          ${toggleLbl}
        </button>
      </div>
    </div>`;
}

// ── Form modal (create / edit) ─────────────────────────────────────────────────

function setupFormModal(container) {
  const modalEl  = document.getElementById('zonaFormModal');
  if (!modalEl) return;

  formModal = new bootstrap.Modal(modalEl);
  const grid    = container.querySelector('#zonasGrid');
  const guardar = document.getElementById('zfGuardar');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.z-edit-btn');
    if (!btn) return;
    const id   = parseInt(btn.dataset.id);
    const zona = allZonas.find(z => z.id_zona === id);
    if (zona) openFormModal(zona);
  });

  guardar.addEventListener('click', () => saveZona(container));
}

function openFormModal(zona) {
  const titleEl = document.getElementById('zonaFormTitle');
  const idEl    = document.getElementById('zfId');
  const nomEl   = document.getElementById('zfNombre');
  const cpEl    = document.getElementById('zfCP');
  const guardar = document.getElementById('zfGuardar');

  if (zona) {
    titleEl.textContent = 'Editar zona';
    idEl.value  = zona.id_zona;
    nomEl.value = zona.nombre_delegacion;
    cpEl.value  = zona.codigo_postal;
  } else {
    titleEl.textContent = 'Nueva zona';
    idEl.value  = '';
    nomEl.value = '';
    cpEl.value  = '';
  }

  guardar.classList.add('zf-btn--confirm');
  guardar.disabled    = false;
  guardar.textContent = 'Guardar';
  formModal.show();
}

async function saveZona(container) {
  const id     = document.getElementById('zfId').value;
  const nombre = document.getElementById('zfNombre').value.trim();
  const cp     = document.getElementById('zfCP').value.trim();
  const guardar = document.getElementById('zfGuardar');

  if (!nombre || !cp) {
    document.getElementById(!nombre ? 'zfNombre' : 'zfCP').focus();
    return;
  }

  guardar.disabled    = true;
  guardar.textContent = 'Guardando…';

  try {
    if (id) {
      await Http.patch('zonas.php', { id_zona: parseInt(id), nombre_delegacion: nombre, codigo_postal: cp });
      const idx = allZonas.findIndex(z => z.id_zona === parseInt(id));
      if (idx !== -1) {
        allZonas[idx].nombre_delegacion = nombre;
        allZonas[idx].codigo_postal     = cp;
      }
      toastSuccess('Zona actualizada correctamente.');
    } else {
      const data = await Http.post('zonas.php', { nombre_delegacion: nombre, codigo_postal: cp });
      allZonas.push({ id_zona: data.id_zona, nombre_delegacion: nombre, codigo_postal: cp, activa: 1 });
      toastSuccess('Zona creada correctamente.');
    }
    formModal.hide();
    updateSubtitle(container);
    renderGrid(container);
    setupFormModal(container);
    setupToggleModal(container);
  } catch (err) {
    toastError(err.message || 'No se pudo guardar la zona.');
  } finally {
    guardar.disabled    = false;
    guardar.textContent = 'Guardar';
  }
}

// ── Toggle modal (activate / deactivate) ──────────────────────────────────────

function setupToggleModal(container) {
  const modalEl = document.getElementById('zonaToggleModal');
  if (!modalEl) return;

  toggleModal = new bootstrap.Modal(modalEl);
  const grid  = container.querySelector('#zonasGrid');
  const confirmBtn = document.getElementById('ztConfirm');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.z-toggle-btn');
    if (!btn) return;
    pendingToggleId = parseInt(btn.dataset.id);
    const zona      = allZonas.find(z => z.id_zona === pendingToggleId);
    if (!zona) return;

    const activa = zona.activa == 1 || zona.activa === true;
    document.getElementById('ztMsg').textContent =
      `¿${activa ? 'Desactivar' : 'Activar'} la zona "${zona.nombre_delegacion}"?`;

    confirmBtn.textContent = activa ? 'Desactivar' : 'Activar';
    confirmBtn.className   = activa
      ? 'zf-btn zf-btn--delete'
      : 'zf-btn zf-btn--confirm';
    confirmBtn.style.background = activa ? '#dc2626' : '';
    confirmBtn.style.color      = '#fff';

    toggleModal.show();
  });

  confirmBtn.addEventListener('click', () => doToggle(container));
}

async function doToggle(container) {
  if (!pendingToggleId) return;

  const confirmBtn = document.getElementById('ztConfirm');
  confirmBtn.disabled    = true;
  confirmBtn.textContent = 'Procesando…';

  try {
    await Http.delete('zonas.php', { id_zona: pendingToggleId });

    const zona = allZonas.find(z => z.id_zona === pendingToggleId);
    if (zona) {
      const wasActive = zona.activa == 1 || zona.activa === true;
      zona.activa = wasActive ? 0 : 1;
      toastSuccess(`Zona ${wasActive ? 'desactivada' : 'activada'} correctamente.`);
    }

    toggleModal.hide();
    renderGrid(container);
    setupFormModal(container);
    setupToggleModal(container);
  } catch (err) {
    toastError(err.message || 'No se pudo cambiar el estado de la zona.');
  } finally {
    confirmBtn.disabled    = false;
    confirmBtn.textContent = 'Confirmar';
    pendingToggleId        = null;
  }
}

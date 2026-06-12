import { farmerCache }  from '../../farmer.js';
import { navigate }      from '../../../../../../assets/js/app.js';
import { PerfilService } from '../../../../../../assets/js/services/perfil.js';
import { toastGoodbye, toastSuccess, toastError } from '../../../../../../assets/js/toast.js';

// ── Star helpers ──────────────────────────────────────────────────────────────

function buildStars(rating) {
  const value   = parseFloat(rating) || 0;
  const clamped = Math.min(5, Math.max(0, value));
  return Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(clamped))                        return '<span class="star star--full">★</span>';
    if (i === Math.floor(clamped) && clamped % 1 >= 0.25) return '<span class="star star--half">★</span>';
    return '<span class="star star--empty">★</span>';
  }).join('');
}

// ── Render sidebar + rating card ──────────────────────────────────────────────

function renderPerfil(container) {
  const perfil   = farmerCache.perfil;
  const vendedor = farmerCache.vendedor;

  const set = (id, val) => {
    const el = container.querySelector(id);
    if (el) el.textContent = val ?? '—';
  };

  if (perfil) {
    const nombreCompleto = [perfil.nombre_razon_social, perfil.apellido]
      .filter(Boolean).join(' ');

    set('#sidebar-name',     nombreCompleto || null);
    set('#sidebar-role',     'Productor');
    set('#sidebar-email',    perfil.email);
    set('#sidebar-phone',    perfil.telefono_contacto);
    set('#sidebar-location', perfil.nombre_delegacion
      ? `${perfil.nombre_delegacion}${perfil.codigo_postal ? ` (${perfil.codigo_postal})` : ''}`
      : null
    );
    set('#sidebar-since', perfil.fecha_registro
      ? new Date(perfil.fecha_registro).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })
      : null
    );

    // Valoraciones / actividad
    const activityList = container.querySelector('#activity-list');
    if (activityList) {
      const valoraciones = perfil.valoraciones ?? [];
      activityList.innerHTML = valoraciones.length
        ? valoraciones.map(v => `
            <div class="activity-row">
              <span class="activity-desc">${v.comentarios ?? 'Sin comentario'}</span>
              <span class="activity-date">${v.fecha_valoracion
                ? new Date(v.fecha_valoracion).toLocaleDateString('es-MX') : ''}</span>
              <span class="activity-status">${'★'.repeat(v.estrellas ?? 0)}</span>
            </div>`).join('')
        : '<p class="activity-empty" style="color:var(--gray-muted);font-size:.85rem;margin:0">Sin actividad reciente.</p>';
    }
  }

  // Account type — farmer is always productor
  container.querySelectorAll('.account-type-option').forEach(el => {
    const isActive = el.id === 'opt-productor';
    el.classList.toggle('active',   isActive);
    el.classList.toggle('disabled', !isActive);
  });

  // Rating card
  const ratingBlock = container.querySelector('#vendedor-rating-block');
  if (ratingBlock) {
    if (vendedor) {
      const rating  = parseFloat(vendedor.puntuacion_promedio) || 0;
      const product = vendedor.producto_principal || '—';
      ratingBlock.innerHTML = `
        <div class="rating-stars">${buildStars(rating)}</div>
        <div class="rating-value">${rating.toFixed(1)} <span class="rating-max">/ 5.0</span></div>
        <div class="rating-lotes">
          <span class="lote-stat"><strong>${vendedor.lotes_disponibles ?? 0}</strong> disponibles</span>
          <span class="lote-stat lote-stat--sep">·</span>
          <span class="lote-stat"><strong>${vendedor.lotes_cerrados ?? 0}</strong> cerrados</span>
          <span class="lote-stat lote-stat--sep">·</span>
          <span class="lote-stat">producto: <strong>${product}</strong></span>
        </div>`;
    } else {
      ratingBlock.innerHTML = '<p style="color:var(--gray-muted);font-size:.85rem;margin:0">Sin datos de vendedor disponibles.</p>';
    }
  }
}

// ── Edit-info modal ───────────────────────────────────────────────────────────

function injectEditModal(zonas) {
  document.getElementById('perfil-edit-modal')?.remove();

  const perfil  = farmerCache.perfil ?? {};
  const options = zonas.map(z =>
    `<option value="${z.id_zona}" ${z.id_zona == perfil.id_zona ? 'selected' : ''}>
       ${z.nombre_delegacion} (${z.codigo_postal})
     </option>`
  ).join('');

  const modal = document.createElement('div');
  modal.id        = 'perfil-edit-modal';
  modal.className = 'modal fade';
  modal.tabIndex  = -1;
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header" style="border-bottom:1px solid #eee;">
          <h5 class="modal-title" style="font-size:15px;font-weight:700;">Editar información</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;padding:24px;">
          <div>
            <label class="perfil-modal-label">Nombre / Razón social</label>
            <input id="edit-nombre"   class="perfil-modal-input" type="text"
                   value="${perfil.nombre_razon_social ?? ''}" placeholder="Nombre o razón social" />
          </div>
          <div>
            <label class="perfil-modal-label">Apellido</label>
            <input id="edit-apellido" class="perfil-modal-input" type="text"
                   value="${perfil.apellido ?? ''}" placeholder="Apellido (opcional)" />
          </div>
          <div>
            <label class="perfil-modal-label">Email</label>
            <input id="edit-email"    class="perfil-modal-input" type="email"
                   value="${perfil.email ?? ''}" placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label class="perfil-modal-label">Teléfono</label>
            <input id="edit-telefono" class="perfil-modal-input" type="tel"
                   value="${perfil.telefono_contacto ?? ''}" placeholder="10 dígitos" />
          </div>
          <div>
            <label class="perfil-modal-label">Zona</label>
            <select id="edit-zona" class="perfil-modal-input">${options}</select>
          </div>
        </div>
        <div class="modal-footer" style="border-top:1px solid #eee;gap:8px;">
          <button type="button" class="perfil-cancel-btn" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" id="perfil-guardar-btn"  class="perfil-save-btn">Guardar</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

// ── Component init ────────────────────────────────────────────────────────────

export function init(container) {
  renderPerfil(container);

  let zonas   = null;
  let bsModal = null;

  window.handleEditarPerfil = async () => {
    if (!zonas) {
      try   { zonas = await PerfilService.getZonas(); }
      catch { zonas = []; }
    }

    const modalEl = injectEditModal(zonas);
    bsModal = new bootstrap.Modal(modalEl);

    modalEl.querySelector('#perfil-guardar-btn').addEventListener('click', async () => {
      const nombre   = modalEl.querySelector('#edit-nombre').value.trim();
      const apellido = modalEl.querySelector('#edit-apellido').value.trim();
      const email    = modalEl.querySelector('#edit-email').value.trim();
      const telefono = modalEl.querySelector('#edit-telefono').value.trim();
      const idZona   = parseInt(modalEl.querySelector('#edit-zona').value);

      if (!nombre || !telefono || !idZona) {
        toastError('Nombre, teléfono y zona son obligatorios.');
        return;
      }

      const btn = modalEl.querySelector('#perfil-guardar-btn');
      btn.disabled    = true;
      btn.textContent = 'Guardando…';

      try {
        await PerfilService.update({
          id_usuario: farmerCache.userId,
          nombre,
          apellido:   apellido || null,
          email:      email    || null,
          telefono,
          id_zona:    idZona,
        });

        const zona = zonas.find(z => z.id_zona == idZona);
        Object.assign(farmerCache.perfil, {
          nombre_razon_social: nombre,
          apellido:            apellido || null,
          email:               email    || null,
          telefono_contacto:   telefono,
          id_zona:             idZona,
          nombre_delegacion:   zona?.nombre_delegacion ?? farmerCache.perfil.nombre_delegacion,
          codigo_postal:       zona?.codigo_postal     ?? farmerCache.perfil.codigo_postal,
        });

        bsModal.hide();
        renderPerfil(container);
        toastSuccess('Información actualizada correctamente.');
      } catch (err) {
        toastError('No se pudo actualizar la información.');
        console.error(err);
      } finally {
        btn.disabled    = false;
        btn.textContent = 'Guardar';
      }
    });

    bsModal.show();
  };

  window.handleModificarPassword = async () => {
    const input    = container.querySelector('#password-input');
    const password = input?.value?.trim() ?? '';

    if (password.length < 6) {
      toastError('La contraseña debe tener al menos 6 caracteres.');
      input?.focus();
      return;
    }

    const btn = container.querySelector('.negoc-btn--modificar');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

    try {
      await PerfilService.updatePassword({ id_usuario: farmerCache.userId, password });
      if (input) input.value = '';
      toastSuccess('Contraseña actualizada correctamente.');
    } catch (err) {
      toastError('No se pudo actualizar la contraseña.');
      console.error(err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Modificar'; }
    }
  };

  window.selectAccountType = () => {};

  window.togglePassword = () => {
    const input = container.querySelector('#password-input');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  };

  window.handleCerrarSesion = () => {
    toastGoodbye({ title: '¡Hasta pronto!', body: 'Cerrando tu sesión…' });
    setTimeout(() => {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/unlogged/inicio');
    }, 2000);
  };
}

export function cleanup() {
  document.getElementById('perfil-edit-modal')?.remove();
  ['handleEditarPerfil', 'handleModificarPassword', 'selectAccountType',
   'togglePassword', 'handleCerrarSesion'].forEach(fn => delete window[fn]);
}

import { userCache, updatePerfil}    from '../../user.js';
import { navigate }     from '../../../../../../assets/js/app.js';
import { PerfilService } from '../../../../../../assets/js/services/perfil.js';
import { toastGoodbye, toastSuccess, toastError } from '../../../../../../assets/js/toast.js';

const ROL_LABEL = {
  productor:    'Productor',
  organizacion: 'Organización',
  admin:        'Administrador',
};

// ── Render sidebar from current userCache.perfil ──────────────────────────────

function renderPerfil(container) {
  const perfil = userCache.perfil;
  if (!perfil) return;

  const avatarImg = container.querySelector('.sidebar-info__avatar img');
  const fotoSrc = perfil.foto 
    ? `../assets/images/users/${perfil.foto}` 
    : '../assets/images/users/default-avatar.svg';

  if (avatarImg) {
    avatarImg.src = fotoSrc;
  } else {
    // Si no existe el <img>, reemplazamos el SVG inicial por un <img>
    const avatarContainer = container.querySelector('.sidebar-info__avatar');
    avatarContainer.innerHTML = `<img src="${fotoSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
  }

  const set = (id, val) => {
    const el = container.querySelector(id);
    if (el) el.textContent = val ?? '—';
  };

  const nombreCompleto = [perfil.nombre_razon_social, perfil.apellido]
    .filter(Boolean).join(' ');

  set('#sidebar-name',     nombreCompleto || null);
  set('#sidebar-role',     ROL_LABEL[perfil.rol_usuario] ?? perfil.rol_usuario);
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

  // Account type — lock to the user's real role, disable the other option
  const roleType = perfil.rol_usuario === 'productor' ? 'productor' : 'usuario';
  container.querySelectorAll('.account-type-option').forEach(el => {
    const isActive = el.id === `opt-${roleType}`;
    el.classList.toggle('active',   isActive);
    el.classList.toggle('disabled', !isActive);
  });

  // Stats
  set('#stat-total',      perfil.total_perfiliaciones);
  set('#stat-aceptadas',  perfil.perfiliaciones_aceptadas);
  set('#stat-pendientes', perfil.perfiliaciones_pendientes);

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

// ── Edit-info modal ───────────────────────────────────────────────────────────

function injectEditModal(zonas) {
  document.getElementById('perfil-edit-modal')?.remove();

  const perfil = userCache.perfil ?? {};
  const options = zonas.map(z =>
    `<option value="${z.id_zona}" ${z.id_zona == perfil.id_zona ? 'selected' : ''}>
       ${z.nombre_delegacion} (${z.codigo_postal})
     </option>`
  ).join('');

  // Ruta por defecto si no hay foto previa (ajústala a tu estructura de directorios)
  const fotoActual = perfil.foto 
    ? `../assets/images/users/${perfil.foto}` 
    : '../assets/images/users/default-avatar.svg';

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
          
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <label class="perfil-modal-label" style="align-self:flex-start;">Fotografía</label>
            <div style="position:relative; width:100px; height:100px; border-radius:50%; overflow:hidden; background:#f0f0f0; cursor:pointer;" onclick="document.getElementById('edit-foto').click()">
              <img id="perfil-preview" src="${fotoActual}" style="width:100%; height:100%; object-fit:cover;" />
              <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.5); color:white; text-align:center; font-size:11px; padding:2px 0;">Cambiar</div>
            </div>
            <input id="edit-foto" type="file" accept="image/*" style="display:none;" />
          </div>

          <div>
            <label class="perfil-modal-label">Nombre</label>
            <input id="edit-nombre"   class="perfil-modal-input" type="text"
                   value="${perfil.nombre_razon_social ?? ''}" placeholder="Nombre" />
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

  let zonas    = null;   // lazy-loaded on first edit click
  let bsModal  = null;

// ── Editar información ──────────────────────────────────────────────────
  window.handleEditarPerfil = async () => {
    if (!zonas) {
      try   { zonas = await PerfilService.getZonas(); }
      catch { zonas = []; }
    }

    const modalEl = injectEditModal(zonas);
    bsModal = new bootstrap.Modal(modalEl);

    // Actualizar previsualización de la imagen al seleccionar un archivo
    const fotoInput = modalEl.querySelector('#edit-foto');
    const preview = modalEl.querySelector('#perfil-preview');
    fotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        preview.src = URL.createObjectURL(file);
      }
    });

    modalEl.querySelector('#perfil-guardar-btn').addEventListener('click', async () => {
      const nombre   = modalEl.querySelector('#edit-nombre').value.trim();
      const apellido = modalEl.querySelector('#edit-apellido').value.trim();
      const email    = modalEl.querySelector('#edit-email').value.trim();
      const telefono = modalEl.querySelector('#edit-telefono').value.trim();
      const idZona   = parseInt(modalEl.querySelector('#edit-zona').value);
      const fotoFile = fotoInput.files[0]; // Capturamos el archivo de la imagen

      if (!nombre || !telefono || !idZona) {
        toastError('Nombre, teléfono y zona son obligatorios.');
        return;
      }

      const btn = modalEl.querySelector('#perfil-guardar-btn');
      btn.disabled    = true;
      btn.textContent = 'Guardando…';

      try {
        await PerfilService.update({
          id_usuario: userCache.userId,
          nombre,
          apellido:   apellido || null,
          email:      email    || null,
          telefono,
          id_zona:    idZona,
          foto:       fotoFile || null // Inyectamos la imagen
        });

        // Actualizar caché para que la UI refleje el cambio instantáneamente
        const zona = zonas.find(z => z.id_zona == idZona);
        Object.assign(userCache.perfil, {
          nombre_razon_social: nombre,
          apellido:            apellido || null,
          email:               email    || null,
          telefono_contacto:   telefono,
          id_zona:             idZona,
          nombre_delegacion:   zona?.nombre_delegacion  ?? userCache.perfil.nombre_delegacion,
          codigo_postal:       zona?.codigo_postal      ?? userCache.perfil.codigo_postal,
        });

        // Si se subió una foto nueva, actualizamos temporalmente con un ObjectURL para la sesión actual
        if (fotoFile) {
          userCache.perfil.foto_perfil = URL.createObjectURL(fotoFile);
        }

        bsModal.hide();
        await updatePerfil();
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

  // ── Modificar contraseña ────────────────────────────────────────────────
  window.handleModificarPassword = async () => {
    const input = container.querySelector('#password-input');
    const password = input?.value?.trim() ?? '';

    if (password.length < 6) {
      toastError('La contraseña debe tener al menos 6 caracteres.');
      input?.focus();
      return;
    }

    const btn = container.querySelector('.perfil-btn--modificar');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

    try {
      await PerfilService.updatePassword({ id_usuario: userCache.userId, password });
      if (input) input.value = '';
      toastSuccess('Contraseña actualizada correctamente.');
    } catch (err) {
      toastError('No se pudo actualizar la contraseña.');
      console.error(err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Modificar'; }
    }
  };

  // ── Other inline onclick handlers ───────────────────────────────────────
  // Account type is read-only — the selection is driven by the user's actual role.
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

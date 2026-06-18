import { farmerCache, updateLotes } from '../../farmer.js';
import { navigate } from '../../../../../../assets/js/app.js';
import { createSearchBar } from '../../../../../../assets/js/components/chat-components.js';
import { createLoteCard } from '../../../../../../assets/js/components/marketplace-components.js';
import { LotesService } from '../../../../../../assets/js/services/lotes.js';
import { toastSuccess, toastError, toastConfirm } from '../../../../../../assets/js/toast.js';

const EXCLUDED = ['caducado', 'eliminado'];

function mapLote(l) {
  return {
    id: l.id_lote,
    name: l.nombre_producto_display || l.nombre_producto || 'Sin nombre',
    categoria: l.nombre_categoria || '',
    price: parseFloat(l.precio_recuperacion_sugerido) || 0,
    estado: l.estado_lote,
    cantidad: parseFloat(l.cantidad_kg) || 0,
    fecha: l.fecha_cosecha || '',
    image: l.foto ? `assets/images/lotes/${l.foto}` : 'assets/images/login/frutas.jpeg',
  };
}

export async function init(container) {
  const userId = farmerCache.userId;
  const searchSlot = container.querySelector('#lotes-search');
  const lotesGrid = container.querySelector('#lotesGrid');
  const addBtn = container.querySelector('#add-lote-btn');
  
  searchSlot.innerHTML = createSearchBar('Buscar lotes...');
  const searchInput = searchSlot.querySelector('.chat-search-bar__input');
  searchInput.parentElement.style.position = 'relative';

  const clearBtn = document.createElement('button');
  clearBtn.innerHTML = '✕';
  Object.assign(clearBtn.style, {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    display: 'none',
    fontSize: '16px',
    padding: '4px'
  });
  searchInput.parentElement.appendChild(clearBtn);

  const catOptions = (farmerCache.categorias || [])
    .map(cat => `<option value="${cat.id_categoria}">${cat.nombre_categoria}</option>`)
    .join('');
    
  let allLotes = farmerCache.lotes
    .filter(l => !EXCLUDED.includes(l.estado_lote))
    .map(mapLote);
  let searchTerm = '';
  
  renderLotes();

  // ==========================================================================
  // 1. OVERLAY: AÑADIR LOTE
  // ==========================================================================
  const addOverlay = document.createElement('div');
  addOverlay.id = 'add-lote-overlay';
  Object.assign(addOverlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '9999',
    display: 'none', alignItems: 'center', justifyContent: 'center', padding: '20px'
  });

  addOverlay.className = 'market-overlay';
  addOverlay.innerHTML = `
    <div class="bg-white rounded-4 shadow position-relative mx-auto p-4 p-md-5 overflow-auto" style="width: 100%; max-width: 650px; max-height: 90vh; animation: modalFadeIn 0.3s ease-out;">
      <button type="button" class="btn-close position-absolute top-0 end-0 m-3 add-close-btn" aria-label="Cerrar"></button>
      <h3 class="fw-bold mb-4 text-dark">Añadir Nuevo Lote</h3>
      
      <form id="add-lote-form" class="d-flex flex-column gap-3">
        <div id="preview-container" class="text-center d-none mb-2">
          <img id="image-preview" src="" alt="Vista previa" class="img-fluid rounded-3 shadow-sm" style="max-height: 200px; width: 100%; object-fit: cover;">
        </div>
        
        <div>
          <label class="form-label fw-semibold mb-1">Foto del producto</label>
          <input type="file" id="new-lote-foto" accept="image/*" class="form-control" required>
        </div>

        <div class="row g-3">
          <div class="col-sm-6">
            <label class="form-label fw-semibold mb-1">Nombre del Producto</label>
            <input type="text" id="new-lote-nombre" class="form-control" placeholder="Ej. Jitomate Saladette" required>
          </div>
          <div class="col-sm-6">
            <label class="form-label fw-semibold mb-1">Categoría</label>
            <select id="new-lote-cat" class="form-select" required>
              <option value="" disabled selected>Selecciona una categoría...</option>
              ${catOptions}
            </select>
          </div>
        </div>

        <div class="row g-3">
          <div class="col-sm-4">
            <label class="form-label fw-semibold mb-1">Cantidad (kg)</label>
            <input type="number" step="0.01" min="0.1" id="new-lote-cant" class="form-control" required>
          </div>
          <div class="col-sm-4">
            <label class="form-label fw-semibold mb-1">Precio Sugerido</label>
            <input type="number" step="0.01" min="0" id="new-lote-precio" class="form-control" required>
          </div>
          <div class="col-sm-4">
            <label class="form-label fw-semibold mb-1">Fecha de Cosecha</label>
            <input type="date" id="new-lote-fecha" class="form-control" required>
          </div>
        </div>

        <div>
          <label class="form-label fw-semibold mb-1">Descripción</label>
          <textarea id="new-lote-desc" rows="3" class="form-control" placeholder="Detalles del producto..."></textarea>
        </div>

        <button type="submit" class="btn text-white mt-2 fw-bold rounded-pill" style="background-color: var(--color-teal); padding: 10px 24px;">Guardar Lote</button>
      </form>
    </div>
  `;
  document.body.appendChild(addOverlay);

  const fotoInput = addOverlay.querySelector('#new-lote-foto');
  const previewContainer = addOverlay.querySelector('#preview-container');
  const imagePreview = addOverlay.querySelector('#image-preview');

  fotoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      imagePreview.src = URL.createObjectURL(file);
      previewContainer.classList.remove('d-none');
    } else {
      imagePreview.src = '';
      previewContainer.classList.add('d-none');
    }
  });

  addBtn?.addEventListener('click', () => {
    document.getElementById('add-lote-form').reset();
    imagePreview.src = '';
    previewContainer.classList.add('d-none');
    addOverlay.style.display = 'flex';
  });

  addOverlay.addEventListener('click', e => {
    if (e.target === addOverlay || e.target.closest('.add-close-btn')) {
      addOverlay.style.display = 'none';
    }
  });

  addOverlay.querySelector('#add-lote-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';

    try {
      const formData = new FormData();
      const file = document.getElementById('new-lote-foto').files[0];
      
      formData.append('foto', file);
      formData.append('id_productor', userId);
      formData.append('nombre', document.getElementById('new-lote-nombre').value.trim());
      formData.append('categoria_id', document.getElementById('new-lote-cat').value);
      formData.append('cantidad', document.getElementById('new-lote-cant').value);
      formData.append('precio_sugerido', document.getElementById('new-lote-precio').value);
      formData.append('fecha', document.getElementById('new-lote-fecha').value);
      formData.append('descripcion', document.getElementById('new-lote-desc').value.trim());
      
      const result = await LotesService.subirLote(formData);
      
      const idLote = result.id_lote || (result.data ? result.data.id_lote : null);
      if(!idLote) throw new Error("No se recibió ID del nuevo lote.");

      const catSelect = document.getElementById('new-lote-cat');
      const catText = catSelect.options[catSelect.selectedIndex].text;

      allLotes.unshift(mapLote({
        id_lote: idLote,
        nombre_producto: formData.get('nombre'),
        nombre_categoria: catText,
        precio_recuperacion_sugerido: formData.get('precio_sugerido'),
        estado_lote: 'disponible',
        cantidad_kg: formData.get('cantidad'),
        fecha_cosecha: formData.get('fecha'),
        foto: result.foto_nombre || (result.data ? result.data.foto_nombre : null)
      }));

      renderLotes();
      toastSuccess('Lote creado correctamente.');
      updateLotes(); // Actualizamos la caché global
      
      addOverlay.style.display = 'none';
      form.reset();
      imagePreview.src = '';
      previewContainer.classList.add('d-none');

    } catch (err) {
      console.error(err);
      toastError('Error al guardar el lote.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });


  // ==========================================================================
  // 2. OVERLAY: EDITAR LOTE
  // ==========================================================================
  const editOverlay = document.createElement('div');
  editOverlay.id = 'edit-lote-overlay';
  Object.assign(editOverlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '9999',
    display: 'none', alignItems: 'center', justifyContent: 'center', padding: '20px'
  });

  editOverlay.className = 'market-overlay';
  editOverlay.innerHTML = `
    <div class="bg-white rounded-4 shadow position-relative mx-auto p-4 p-md-5 overflow-auto" style="width: 100%; max-width: 650px; max-height: 90vh; animation: modalFadeIn 0.3s ease-out;">
      <button type="button" class="btn-close position-absolute top-0 end-0 m-3 edit-close-btn" aria-label="Cerrar"></button>
      <h3 class="fw-bold mb-4 text-dark">Editar Lote</h3>
      
      <form id="edit-lote-form" class="d-flex flex-column gap-3">
        <input type="hidden" id="edit-lote-id">

        <div id="edit-preview-container" class="text-center d-none mb-2">
          <img id="edit-image-preview" src="" alt="Vista previa" class="img-fluid rounded-3 shadow-sm" style="max-height: 200px; width: 100%; object-fit: cover;">
        </div>
        
        <div>
          <label class="form-label fw-semibold mb-1">Actualizar foto (Opcional)</label>
          <input type="file" id="edit-lote-foto" accept="image/*" class="form-control">
        </div>

        <div class="row g-3">
          <div class="col-sm-6">
            <label class="form-label fw-semibold mb-1">Nombre del Producto</label>
            <input type="text" id="edit-lote-nombre" class="form-control" required>
          </div>
          <div class="col-sm-6">
            <label class="form-label fw-semibold mb-1">Categoría</label>
            <select id="edit-lote-cat" class="form-select" required>
              <option value="" disabled>Selecciona una categoría...</option>
              ${catOptions}
            </select>
          </div>
        </div>

        <div class="row g-3">
          <div class="col-sm-4">
            <label class="form-label fw-semibold mb-1">Cantidad (kg)</label>
            <input type="number" step="0.01" min="0.1" id="edit-lote-cant" class="form-control" required>
          </div>
          <div class="col-sm-4">
            <label class="form-label fw-semibold mb-1">Precio Sugerido</label>
            <input type="number" step="0.01" min="0" id="edit-lote-precio" class="form-control" required>
          </div>
          <div class="col-sm-4">
            <label class="form-label fw-semibold mb-1">Fecha de Cosecha</label>
            <input type="date" id="edit-lote-fecha" class="form-control" required>
          </div>
        </div>

        <div>
          <label class="form-label fw-semibold mb-1">Descripción</label>
          <textarea id="edit-lote-desc" rows="3" class="form-control"></textarea>
        </div>

        <button type="submit" class="btn text-white mt-2 fw-bold rounded-pill" style="background-color: var(--color-teal); padding: 10px 24px;">Actualizar Lote</button>
      </form>
    </div>
  `;
  document.body.appendChild(editOverlay);

  const editFotoInput = editOverlay.querySelector('#edit-lote-foto');
  const editPreviewContainer = editOverlay.querySelector('#edit-preview-container');
  const editImagePreview = editOverlay.querySelector('#edit-image-preview');

  editFotoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      editImagePreview.src = URL.createObjectURL(file);
      editPreviewContainer.classList.remove('d-none');
    }
  });

  editOverlay.addEventListener('click', e => {
    if (e.target === editOverlay || e.target.closest('.edit-close-btn')) {
      editOverlay.style.display = 'none';
    }
  });

  // Manejador del submit de edición
  editOverlay.querySelector('#edit-lote-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Actualizando...';

    try {
      const formData = new FormData();
      const file = document.getElementById('edit-lote-foto').files[0];
      const loteId = document.getElementById('edit-lote-id').value;
      
      formData.append('id_lote', loteId);
      formData.append('id_productor', userId);
      formData.append('nombre', document.getElementById('edit-lote-nombre').value.trim());
      formData.append('categoria_id', document.getElementById('edit-lote-cat').value);
      formData.append('cantidad', document.getElementById('edit-lote-cant').value);
      formData.append('precio_sugerido', document.getElementById('edit-lote-precio').value);
      formData.append('fecha', document.getElementById('edit-lote-fecha').value);
      formData.append('descripcion', document.getElementById('edit-lote-desc').value.trim());
      
      // Solo agregamos la foto si el usuario seleccionó una nueva
      if(file) formData.append('foto', file);
      
      const result = await LotesService.actualizarLote(formData); 
      
      toastSuccess('Lote actualizado correctamente.');
      
      // Actualizamos la caché desde el servidor para traer los datos frescos (incluida la foto vieja o nueva)
      await updateLotes(); 
      
      // Volvemos a mapear la lista visual con los datos frescos
      allLotes = farmerCache.lotes
        .filter(l => !EXCLUDED.includes(l.estado_lote))
        .map(mapLote);
      
      renderLotes();
      editOverlay.style.display = 'none';

    } catch (err) {
      console.error(err);
      toastError('Error al actualizar el lote.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });


  // ==========================================================================
  // 3. EVENTOS GENERALES (Buscador, Estados, Eliminar, Editar)
  // ==========================================================================
  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    renderLotes();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    clearBtn.style.display = 'none';
    renderLotes();
    searchInput.focus();
  });

  lotesGrid.addEventListener('change', async e => {
    const sel = e.target.closest('.lote-estado-select');
    if (!sel) return;

    const lotId = parseInt(sel.dataset.id);
    const newState = sel.value;
    const prev = sel.dataset.prev;

    sel.disabled = true;
    sel.dataset.prev = newState;

    try {
      await LotesService.cambiarEstado(lotId, userId, newState);
      toastSuccess('Estado actualizado.');
      const lote = allLotes.find(l => l.id === lotId);
      if (lote) lote.estado = newState;
    } catch (err) {
      sel.value = prev;
      sel.dataset.prev = prev;
      toastError('No se pudo actualizar el estado.');
    } finally {
      sel.disabled = false;
    }
  });

lotesGrid.addEventListener('click', e => {
    const btn = e.target.closest('.lote-eliminar-btn');
    if (!btn) return;

    const lotId = parseInt(btn.dataset.id);

    // Llamamos a tu toast personalizado
    toastConfirm({
      message: '¿Seguro que deseas eliminar este lote?',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        btn.disabled = true;

        try {
          // Usamos farmerCache.userId para evitar el error de referencia
          await LotesService.cambiarEstado(lotId, farmerCache.userId, 'eliminado');
          allLotes = allLotes.filter(l => l.id !== lotId);
          renderLotes();
          toastSuccess('Lote eliminado.');
        } catch (err) {
          btn.disabled = false;
          toastError('No se pudo eliminar el lote.');
        }
      }
    });
  });

  // ── Modificado: Abrir el modal de edición con los datos en caché ───────────
  lotesGrid.addEventListener('click', e => {
    const btn = e.target.closest('.lote-editar-btn');
    if (!btn) return;
    
    const lotId = parseInt(btn.dataset.id);
    const loteOriginal = farmerCache.lotes.find(l => l.id_lote === lotId);
    
    if (!loteOriginal) {
      toastError('No se pudieron cargar los datos del lote.');
      return;
    }

    // Llenar el formulario con los datos originales
    document.getElementById('edit-lote-id').value = loteOriginal.id_lote;
    document.getElementById('edit-lote-nombre').value = loteOriginal.nombre_producto || '';
    document.getElementById('edit-lote-cat').value = loteOriginal.id_categoria || '';
    document.getElementById('edit-lote-cant').value = loteOriginal.cantidad_kg || '';
    document.getElementById('edit-lote-precio').value = loteOriginal.precio_recuperacion_sugerido || '';
    document.getElementById('edit-lote-fecha').value = loteOriginal.fecha_cosecha || '';
    document.getElementById('edit-lote-desc').value = loteOriginal.descripcion_producto || '';
    
    // Limpiar input de archivo (por si tenía algo de una edición previa no guardada)
    document.getElementById('edit-lote-foto').value = '';

    // Manejar la previsualización de la foto existente
    if (loteOriginal.foto) {
      editImagePreview.src = `assets/images/lotes/${loteOriginal.foto}`;
      editPreviewContainer.classList.remove('d-none');
    } else {
      editImagePreview.src = '';
      editPreviewContainer.classList.add('d-none');
    }

    // Mostrar el modal
    editOverlay.style.display = 'flex';
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  function renderLotes() {
    const term = searchTerm.toLowerCase();
    const filtered = allLotes.filter(l =>
      l.name.toLowerCase().includes(term) ||
      l.categoria.toLowerCase().includes(term)
    );
    lotesGrid.innerHTML = filtered.length
      ? filtered.map(createLoteCard).join('')
      : '<p class="market-empty">No se encontraron lotes.</p>';
  }
}
import { farmerCache, updateLotes } from '../../farmer.js';
import { navigate } from '../../../../../../assets/js/app.js';
import { createSearchBar } from '../../../../../../assets/js/components/chat-components.js';
import { createLoteCard } from '../../../../../../assets/js/components/marketplace-components.js';
import { LotesService } from '../../../../../../assets/js/services/lotes.js';
import { toastSuccess, toastError } from '../../../../../../assets/js/toast.js';

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
    // Apuntamos a la carpeta lotes usando el nombre del archivo guardado
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
  
  // Iteramos sobre las categorías en caché para crear los <option>
  const catOptions = (farmerCache.categorias || [])
    .map(cat => `<option value="${cat.id_categoria}">${cat.nombre_categoria}</option>`)
    .join('');
    
  let allLotes = farmerCache.lotes
    .filter(l => !EXCLUDED.includes(l.estado_lote))
    .map(mapLote);
  let searchTerm = '';
  
  renderLotes();

  // ── Overlay Añadir Lote ────────────────────────────────────────────────────
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

  // ── Lógica de previsualización de imagen ───────────────────────────────────
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

  // ── Manejadores del Overlay ────────────────────────────────────────────────
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

  // ── Submit con FormData ────────────────────────────────────────────────────
  addOverlay.querySelector('#add-lote-form').addEventListener('submit', async e => {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Animación de carga nativa de Bootstrap
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

      // Llama al backend (asegúrate de que LotesService.subirLote envíe el formData directo sin stringify)
      const result = await LotesService.subirLote(formData);

      // Obtenemos el texto de la categoría seleccionada para la tarjeta
      const catSelect = document.getElementById('new-lote-cat');
      const catText = catSelect.options[catSelect.selectedIndex].text;

      // Agregamos el lote mapeado al inicio del array
      allLotes.unshift(mapLote({
        id_lote: result.id_lote,
        nombre_producto: formData.get('nombre'),
        nombre_categoria: catText,
        precio_recuperacion_sugerido: formData.get('precio_sugerido'),
        estado_lote: 'disponible',
        cantidad_kg: formData.get('cantidad'),
        fecha_cosecha: formData.get('fecha'),
        foto: result.foto_nombre // PHP nos debe devolver el nombre guardado (ej. lote_xyz.jpg)
      }));

      renderLotes();
      toastSuccess('Lote creado correctamente.');
      updateLotes();
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

  // ── Buscador ───────────────────────────────────────────────────────────────
  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    renderLotes();
  });

  // ── Estado select ──────────────────────────────────────────────────────────
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

  // ── Eliminar button ────────────────────────────────────────────────────────
  lotesGrid.addEventListener('click', async e => {
    const btn = e.target.closest('.lote-eliminar-btn');
    if (!btn) return;

    const lotId = parseInt(btn.dataset.id);
    if (!confirm('¿Seguro que deseas eliminar este lote?')) return;

    btn.disabled = true;

    try {
      await LotesService.cambiarEstado(lotId, userId, 'eliminado');
      allLotes = allLotes.filter(l => l.id !== lotId);
      renderLotes();
      toastSuccess('Lote eliminado.');
    } catch (err) {
      btn.disabled = false;
      toastError('No se pudo eliminar el lote.');
    }
  });

  // ── Editar button ──────────────────────────────────────────────────────────
  lotesGrid.addEventListener('click', e => {
    const btn = e.target.closest('.lote-editar-btn');
    if (!btn) return;
    sessionStorage.setItem('editarLoteId', btn.dataset.id);
    navigate('/productor/editar-lote');
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
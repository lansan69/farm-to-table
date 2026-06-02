/* ============================================================
   FARM TO TABLE — publicar_lote.js
   Funcionalidades:
     1. Vista previa en tiempo real (nombre, ubicación, precio)
     2. Upload de imagen con drag & drop
     3. Validación de formulario
     4. Modal de confirmación
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Elementos ─────────────────────────────────────────── */
  const form          = document.getElementById('formLote');
  const inputNombre   = document.getElementById('nombre_producto');
  const inputUbicacion= document.getElementById('ubicacion');
  const inputPrecio   = document.getElementById('precio_kg');
  const fileInput     = document.getElementById('fileInput');
  const dropZone      = document.getElementById('dropZone');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const previewImg    = document.getElementById('previewImg');
  const btnSelectFile = document.getElementById('btnSelectFile');
  const btnRemoveImg  = document.getElementById('btnRemoveImg');
  const modalOverlay  = document.getElementById('modalOverlay');
  const btnVerCatalogo  = document.getElementById('btnVerCatalogo');
  const btnPublicarOtro = document.getElementById('btnPublicarOtro');

  // Preview card elements
  const previewName   = document.getElementById('previewName');
  const previewLoc    = document.getElementById('previewLoc');
  const previewPrice  = document.getElementById('previewPrice');
  const previewCardImg= document.getElementById('previewCardImg');

  /* ── 1. Vista previa en tiempo real ───────────────────── */
  inputNombre.addEventListener('input', () => {
    previewName.textContent = inputNombre.value.trim() || 'Nombre del producto';
  });

  inputUbicacion.addEventListener('input', () => {
    previewLoc.textContent = inputUbicacion.value.trim()
      ? `📍 ${inputUbicacion.value.trim()}`
      : '📍 Ciudad, Estado';
  });

  inputPrecio.addEventListener('input', () => {
    const val = parseFloat(inputPrecio.value);
    previewPrice.textContent = isNaN(val) ? '$0.00 / kg' : `$${val.toFixed(2)} / kg`;
  });

  /* ── 2. Upload de imagen ───────────────────────────────── */
  btnSelectFile.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone) fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      loadImage(fileInput.files[0]);
    }
  });

  // Drag & drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  });

  function loadImage(file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      // Mostrar en upload zone
      previewImg.src = e.target.result;
      previewImg.classList.remove('hidden');
      uploadPlaceholder.classList.add('hidden');
      btnRemoveImg.classList.remove('hidden');

      // Mostrar en card preview
      previewCardImg.innerHTML = `<img src="${e.target.result}"
        style="width:100%;height:130px;object-fit:cover;" alt="preview" />`;
    };
    reader.readAsDataURL(file);
  }

  btnRemoveImg.addEventListener('click', () => {
    fileInput.value = '';
    previewImg.src = '';
    previewImg.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    btnRemoveImg.classList.add('hidden');
    previewCardImg.innerHTML = `<span class="product-emoji">🥦</span>`;
  });

  /* ── 3. Validación ─────────────────────────────────────── */
  const requiredFields = form.querySelectorAll('[required]');

  function validateField(input) {
    const group = input.closest('.field-group');
    if (!group) return true;
    const valid = input.value.trim() !== '' && input.checkValidity();
    group.classList.toggle('invalid', !valid);
    return valid;
  }

  // Validar al perder foco
  requiredFields.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.closest('.field-group').classList.contains('invalid')) {
        validateField(input);
      }
    });
  });

  /* ── 4. Submit → Modal ─────────────────────────────────── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let allValid = true;
    requiredFields.forEach(input => {
      if (!validateField(input)) allValid = false;
    });

    if (!allValid) {
      // Scroll al primer campo inválido
      const firstInvalid = form.querySelector('.field-group.invalid input, .field-group.invalid select');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Todo válido → mostrar modal
    showModal();
  });

  /* ── Modal ─────────────────────────────────────────────── */
  function showModal() {
    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // Cerrar modal al hacer clic fuera
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  // Botón "Ver mi catálogo"
  btnVerCatalogo.addEventListener('click', () => {
    hideModal();
    // Aquí iría la navegación real: window.location.href = 'catalogo.html';
    alert('Redirigiendo al catálogo...');
  });

  // Botón "Publicar otro lote"
  btnPublicarOtro.addEventListener('click', () => {
    hideModal();
    form.reset();
    // Reset preview
    previewName.textContent   = 'Nombre del producto';
    previewLoc.textContent    = '📍 Ciudad, Estado';
    previewPrice.textContent  = '$0.00 / kg';
    previewCardImg.innerHTML  = `<span class="product-emoji">🥦</span>`;
    previewImg.src            = '';
    previewImg.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    btnRemoveImg.classList.add('hidden');
    fileInput.value           = '';
    // Limpiar errores
    form.querySelectorAll('.field-group.invalid')
        .forEach(g => g.classList.remove('invalid'));
    // Scroll arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

});
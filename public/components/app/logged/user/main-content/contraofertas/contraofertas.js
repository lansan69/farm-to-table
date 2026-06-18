import { userCache }              from '../../user.js';
import { NegociacionesService }    from '../../../../../../assets/js/services/negociaciones.js';
import { ChatsService }            from '../../../../../../assets/js/services/chats.js';
import { createNegociacionCard }   from '../../../../../../assets/js/components/negociacion-components.js';
import { createSearchBar }         from '../../../../../../assets/js/components/chat-components.js';
import { navigate }                from '../../../../../../assets/js/app.js';

const ESTADO_LABELS = {
  pendiente:              'Pendiente',
  contraoferta_productor: 'Contraoferta',
  aceptada:               'Aceptada',
  rechazada:              'Rechazada',
};

export async function init(container) {
  const userId      = userCache.userId;
  console.log(userCache.negociaciones);
  const grid        = container.querySelector('#negocGrid');
  const searchSlot  = container.querySelector('#contraofertas-search');
  const filtersWrap = container.querySelector('.filters-wrap');
  const filtersBar  = filtersWrap.querySelector('.filters');
  const toggleBtn   = filtersWrap.querySelector('.filters-toggle');

  let allNegoc     = [];
  let activeEstado = '';
  let searchQuery  = '';

  // ── Search bar ──────────────────────────────────────────────────────────────

  searchSlot.innerHTML = createSearchBar('Buscar producto…');
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

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
    renderGrid();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.style.display = 'none';
    renderGrid();
    searchInput.focus();
  });

  // ── Hamburger toggle ────────────────────────────────────────────────────────

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = filtersWrap.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!filtersWrap.contains(e.target)) {
      filtersWrap.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // ── Estado filter click ─────────────────────────────────────────────────────

  filtersBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;

    filtersBar.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeEstado = btn.dataset.estado ?? '';

    filtersWrap.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');

    renderGrid();
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function buildEstadoFilters(negocs) {
    const estados = [...new Set(negocs.map(n => n.estado_negociacion).filter(Boolean))];

    filtersBar.querySelectorAll('.filter[data-estado]:not([data-estado=""])').forEach(b => b.remove());

    estados.forEach(estado => {
      const btn = document.createElement('button');
      btn.className      = 'filter';
      btn.dataset.estado = estado;
      btn.textContent    = ESTADO_LABELS[estado] ?? estado;
      filtersBar.appendChild(btn);
    });
  }

  function renderGrid() {
    const filtered = allNegoc.filter(n => {
      const matchesEstado = !activeEstado || n.estado_negociacion === activeEstado;
      const matchesSearch = !searchQuery
        || (n.nombre_producto || '').toLowerCase().includes(searchQuery)
        || (n.nombre_vendedor || '').toLowerCase().includes(searchQuery);
      return matchesEstado && matchesSearch;
    });

    if (!filtered.length) {
      grid.innerHTML = '<p class="negoc-empty">No se encontraron negociaciones.</p>';
      return;
    }

    grid.innerHTML = filtered.map(n => createNegociacionCard({
      id:             n.id_negociacion,
      idLote:         n.id_lote,
      nombre:         n.nombre_producto,
      vendedor:       n.nombre_vendedor,
      zona:           n.zona || '',
      precioOfertado: parseFloat(n.ultima_oferta)                || 0,
      precioReal:     parseFloat(n.precio_recuperacion_sugerido) || 0,
      estado:         n.estado_negociacion,
      comentario:     n.ultimo_comentario || '',
      foto:           n.foto || null
    })).join('');
  }

  // ── Card button clicks (event delegation — survives re-renders) ────────────

  grid.addEventListener('click', async (e) => {
    const msgBtn  = e.target.closest('.negoc-btn--msg');
    const editBtn = e.target.closest('.negoc-btn--edit');

    if (msgBtn) {
      const id  = parseInt(msgBtn.dataset.id);
      const neg = allNegoc.find(n => n.id_negociacion === id);
      if (!neg) return;
      if (['aceptada', 'rechazada'].includes(neg.estado_negociacion)) return;

      msgBtn.disabled = true;
      try {
        const { chat_id } = await ChatsService.findOrCreate(userId, neg.id_vendedor, neg.id_negociacion);
        sessionStorage.setItem('openChatId', chat_id);
        navigate('/usuario/chats');
      } catch (err) {
        console.error('Error abriendo chat:', err);
        msgBtn.disabled = false;
      }
    }

    if (editBtn) {
      const id   = parseInt(editBtn.dataset.id);
      const card = editBtn.closest('.negoc-card');
      const neg  = allNegoc.find(n => n.id_negociacion === id);
      if (!neg || !card) return;
      if (['aceptada', 'rechazada'].includes(neg.estado_negociacion)) return;

      // ── Second click: save ────────────────────────────────────────────
      if (editBtn.dataset.editing === 'true') {
        const input         = card.querySelector('.negoc-offer-input');
        const textarea      = card.querySelector('.negoc-comment-input');
        const newMonto      = parseFloat(input?.value);
        const newComentario = textarea?.value.trim() || null;
        if (!newMonto || newMonto <= 0) { input?.focus(); return; }

        editBtn.disabled = true;
        try {
          await NegociacionesService.contraoferta({
            id_negociacion: id,
            id_emisor:      userId,
            monto:          newMonto,
            comentario:     newComentario,
          });

          neg.ultima_oferta     = newMonto;
          neg.ultimo_comentario = newComentario;

          input.replaceWith(
            Object.assign(document.createElement('span'), {
              className:   'negoc-price-value negoc-price-value--offer',
              textContent: `$${newMonto.toFixed(2)}`,
            })
          );
          textarea.replaceWith(
            Object.assign(document.createElement('p'), {
              className: 'negoc-comment',
              innerHTML: newComentario || '<span class="negoc-comment--empty">Sin comentario</span>',
            })
          );
          delete editBtn.dataset.editing;
          editBtn.textContent = 'Modificar oferta';
        } catch (err) {
          console.error('Error guardando oferta:', err);
        } finally {
          editBtn.disabled = false;
        }
        return;
      }

      // ── First click: enter edit mode ──────────────────────────────────
      const offerSpan    = card.querySelector('.negoc-price-value--offer');
      const commentEl    = card.querySelector('.negoc-comment');
      const currentValue = parseFloat(neg.ultima_oferta) || 0;

      const input = document.createElement('input');
      input.type      = 'number';
      input.min       = '0';
      input.step      = '0.01';
      input.value     = currentValue.toFixed(2);
      input.className = 'negoc-offer-input';
      offerSpan.replaceWith(input);

      const textarea = document.createElement('textarea');
      textarea.className   = 'negoc-comment-input';
      textarea.rows        = 2;
      textarea.value       = neg.ultimo_comentario || '';
      textarea.placeholder = 'Agregar comentario…';
      commentEl.replaceWith(textarea);
      input.focus();
      input.select();

      editBtn.dataset.editing = 'true';
      editBtn.textContent     = 'Guardar oferta';
    }
  });

  // ── Render from cache (no fetch needed) ────────────────────────────────────

  if (!userId) {
    grid.innerHTML = '<p class="negoc-empty">Inicia sesión para ver tus negociaciones.</p>';
    return;
  }

  allNegoc = userCache.negociaciones;
  buildEstadoFilters(allNegoc);
  renderGrid();
}

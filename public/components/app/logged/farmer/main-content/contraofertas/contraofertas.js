import { farmerCache }              from '../../farmer.js';
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

const ESTADO_CSS = {
  pendiente:              'negoc-estado--pending',
  contraoferta_productor: 'negoc-estado--counter',
  aceptada:               'negoc-estado--accepted',
  rechazada:              'negoc-estado--rejected',
};

function updateCardEstado(card, estado) {
  const badge = card?.querySelector('.negoc-estado');
  if (badge) {
    badge.textContent = ESTADO_LABELS[estado] ?? estado;
    badge.className   = `negoc-estado ${ESTADO_CSS[estado] ?? ''}`;
  }
  card?.querySelectorAll('.negoc-btn').forEach(b => { b.disabled = true; });
}

export function init(container) {
  const userId      = farmerCache.userId;
  console.log(farmerCache);
  const grid        = container.querySelector('#negocGrid');
  const searchSlot  = container.querySelector('#contraofertas-search');
  const filtersWrap = container.querySelector('.filters-wrap');
  const filtersBar  = filtersWrap.querySelector('.filters');
  const toggleBtn   = filtersWrap.querySelector('.filters-toggle');

  let allNegoc     = [];
  let activeEstado = '';
  let searchQuery  = '';

  // ── Search bar ──────────────────────────────────────────────────────────────

  searchSlot.innerHTML = createSearchBar('Buscar producto o comprador…');
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
        || (n.nombre_producto   || '').toLowerCase().includes(searchQuery)
        || (n.nombre_comprador  || '').toLowerCase().includes(searchQuery);
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
      vendedor:       n.nombre_comprador,
      zona:           n.zona || '',
      precioOfertado: parseFloat(n.ultima_oferta)                || 0,
      precioReal:     parseFloat(n.precio_recuperacion_sugerido) || 0,
      estado:         n.estado_negociacion,
      comentario:     n.ultimo_comentario || '',
      mode:           'productor',
      foto:           n.foto || null
    })).join('');
  }

  // ── Card button clicks (event delegation — survives re-renders) ────────────

  grid.addEventListener('click', async (e) => {
    const msgBtn     = e.target.closest('.negoc-btn--msg');
    const aceptarBtn = e.target.closest('.negoc-btn--accept');
    const rechazarBtn = e.target.closest('.negoc-btn--reject');

    // ── Enviar mensaje ──────────────────────────────────────────────────
    if (msgBtn) {
      const id  = parseInt(msgBtn.dataset.id);
      const neg = allNegoc.find(n => n.id_negociacion === id);
      if (!neg) return;

      msgBtn.disabled = true;
      try {
        const { chat_id } = await ChatsService.findOrCreate(userId, neg.id_comprador, neg.id_negociacion);
        sessionStorage.setItem('openChatId', chat_id);
        navigate('/productor/chats');
      } catch (err) {
        console.error('Error abriendo chat:', err);
        msgBtn.disabled = false;
      }
    }

    // ── Aceptar ─────────────────────────────────────────────────────────
    if (aceptarBtn) {
      const id   = parseInt(aceptarBtn.dataset.id);
      const card = aceptarBtn.closest('.negoc-card');
      const neg  = allNegoc.find(n => n.id_negociacion === id);
      if (!neg || !card) return;

      aceptarBtn.disabled  = true;
      aceptarBtn.textContent = 'Aceptando…';
      card.querySelector('.negoc-btn--reject')?.setAttribute('disabled', '');

      try {
        await NegociacionesService.aceptar(id);
        neg.estado_negociacion = 'aceptada';
        updateCardEstado(card, 'aceptada');
      } catch (err) {
        console.error('Error aceptando negociación:', err);
        aceptarBtn.disabled    = false;
        aceptarBtn.textContent = 'Aceptar';
        card.querySelector('.negoc-btn--reject')?.removeAttribute('disabled');
      }
    }

    // ── Rechazar ────────────────────────────────────────────────────────
    if (rechazarBtn) {
      const id   = parseInt(rechazarBtn.dataset.id);
      const card = rechazarBtn.closest('.negoc-card');
      const neg  = allNegoc.find(n => n.id_negociacion === id);
      if (!neg || !card) return;

      rechazarBtn.disabled    = true;
      rechazarBtn.textContent = 'Rechazando…';
      card.querySelector('.negoc-btn--accept')?.setAttribute('disabled', '');

      try {
        await NegociacionesService.rechazar(id);
        neg.estado_negociacion = 'rechazada';
        updateCardEstado(card, 'rechazada');
      } catch (err) {
        console.error('Error rechazando negociación:', err);
        rechazarBtn.disabled    = false;
        rechazarBtn.textContent = 'Rechazar';
        card.querySelector('.negoc-btn--accept')?.removeAttribute('disabled');
      }
    }
  });

  // ── Render from cache ───────────────────────────────────────────────────────

  if (!userId) {
    grid.innerHTML = '<p class="negoc-empty">Inicia sesión para ver tus negociaciones.</p>';
    return;
  }

  allNegoc = farmerCache.negociaciones;
  buildEstadoFilters(allNegoc);
  renderGrid();
}

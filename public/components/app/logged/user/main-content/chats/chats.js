import { ReportesService } from '../../../../../../assets/js/services/reportes.js';
import { userCache, updateChats, updateReportes} from '../../user.js';
import {
  createSearchBar,
  createContactCard,
  createChatHeader,
  createChatMessage,
  createMessageInput,
  createEmptyState,
} from '../../../../../../assets/js/components/chat-components.js';
import { ChatsService } from '../../../../../../assets/js/services/chats.js';
import {
  initAbly,
  subscribeToChat,
  publishMessage,
  subscribeToInbox,
  notifyInbox,
} from '../../../../../../assets/js/ably.js';
import { toastNotification, toastContactoReportado } from '../../../../../../assets/js/toast.js';

const AVATAR_COLORS = ['#1B853F', '#00796B', '#85B72C', '#E74C3C', '#E67E22', '#9B59B6', '#3498DB', '#1ABC9C'];
const CLOSED_STATES  = ['aceptada', 'rechazada'];
const BACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

// ── Time helpers ──────────────────────────────────────────────────────────────

function formatContactTime(dateStr) {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const now = new Date();

  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';

  if (now - d < 7 * 24 * 60 * 60 * 1000) {
    return ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
  }

  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Data mappers ──────────────────────────────────────────────────────────────

function apiChatToContact(row, index) {
  const apellido = row.contact_apellido ? ` ${row.contact_apellido}` : '';
  const closed = CLOSED_STATES.includes(row.estado_negociacion);
  const contactId = row.my_role === 'a'
    ? parseInt(row.usuario_b, 10)
    : parseInt(row.usuario_a, 10);

  return {
    id: row.chat_id,
    contactId,
    name: row.contact_name + apellido + " - " + row.nombre_producto,
    // AÑADE ESTA LÍNEA PARA QUE EL OBJETO CONTACT LA TENGA DISPONIBLE:
    fotoLote: row.foto_lote,
    lastMessage: row.last_message || '',
    time: formatContactTime(row.last_message_time),
    unread: 0,
    online: false,
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    estadoNegociacion: row.estado_negociacion,
    closed,
  };
}

function apiMsgToMsg(msg, userId) {
  return {
    text: msg.body,
    time: formatMessageTime(msg.fecha_enviado),
    sent: parseInt(msg.remitente_id, 10) === userId,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

let _unsubscribers = [];

export async function init(container) {
  _unsubscribers = [];
  const userId = userCache.userId;

  let contacts     = [];
  let activeId     = null;
  let searchTerm   = '';
  let filterEstado = '';

  const msgCache = new Map();
  const unsubscribers = _unsubscribers;

  const layout     = container.querySelector('.chat-layout');
  const searchSlot = container.querySelector('#contact-search');
  const filtersBar = container.querySelector('#chat-filters');
  const itemsSlot  = container.querySelector('#contact-items');
  const headerSlot = container.querySelector('#chat-header');
  const msgsSlot   = container.querySelector('#chat-messages');
  const inputSlot  = container.querySelector('#chat-input');

  searchSlot.innerHTML = createSearchBar();
  inputSlot.innerHTML  = createMessageInput();
  msgsSlot.innerHTML   = createEmptyState();

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

  const inputField = inputSlot.querySelector('.message-input__field');
  const sendBtn    = inputSlot.querySelector('.message-input__send');

  // ── Build contacts from cache (instant render) ────────────────────────
  const cachedRows = userCache.chats ?? [];
  contacts = cachedRows.map((r, i) => {
    const contact = apiChatToContact(r, i);
    msgCache.set(contact.id, (r.messages ?? []).map(m => apiMsgToMsg(m, userId)));
    return contact;
  });
  renderContacts();
  // Auto-open a specific chat if another page requested it
  const pendingChatId = sessionStorage.getItem('openChatId');
  if (pendingChatId) {
    const id = parseInt(pendingChatId, 10);
    if (contacts.some(c => c.id === id)) {
      openChat(id);
    } else {
      // Chat not in cache yet (just created) — fetch fresh and open
      ChatsService.getChats(userId).then(rows => {
        if (!Array.isArray(rows)) return;
        const row = rows.find(r => parseInt(r.chat_id, 10) === id);
        if (!row) return;
        if (!contacts.some(c => c.id === id)) {
          addNewChat(row, contacts.length);
          renderContacts();
        }
        openChat(id);
      }).catch(err => console.error('Error abriendo chat pendiente:', err));
    }
  }

  // ── Ably real-time ────────────────────────────────────────────────────
  try {
    await initAbly(userId);

    // Subscribe to every known chat channel
    contacts.forEach(c => {
      const unsub = subscribeToChat(c.id, msg => handleIncomingMessage(c.id, msg));
      unsubscribers.push(unsub);
    });

    // Personal inbox: fires when someone sends us a message on a chat
    // we weren't subscribed to (new chat or first message after shell load).
    const inboxUnsub = subscribeToInbox(userId, handleInboxPing);
    unsubscribers.push(inboxUnsub);

  } catch (err) {
    console.error('Error inicializando Ably:', err);
  }

  // ── Send (optimistic) ─────────────────────────────────────────────────
  async function sendMessage() {
    if (!activeId) return;
    const text = inputField.value.trim();
    if (!text) return;

    const contact = contacts.find(c => c.id === activeId);
    if (contact?.closed) return;

    const time = formatMessageTime(new Date().toISOString());

    const cached = msgCache.get(activeId) ?? [];
    cached.push({ text, time, sent: true });
    msgCache.set(activeId, cached);

    msgsSlot.insertAdjacentHTML('beforeend', createChatMessage(text, time, true));
    msgsSlot.scrollTop = msgsSlot.scrollHeight;

    contact.lastMessage = text;
    contact.time        = time;
    inputField.value    = '';
    inputField.focus();
    renderContacts();

    publishMessage(activeId, { text, time, senderId: userId });

    // Ping recipient's inbox so their contact list updates instantly
    if (contact.contactId) {
      notifyInbox(contact.contactId, activeId).catch(() => {});
    }

    await ChatsService.sendMessage(activeId, userId, text).catch(err => {
      console.error('Error enviando mensaje:', err);
    });

    updateChats();
  }

// ── Incoming real-time message on a subscribed chat channel ───────────
  function handleIncomingMessage(chatId, msg) {
    // Blindaje doble igual que en el productor
    if (msg.clientId === String(userId) || msg.data.senderId === userId) return;

    const { text, time } = msg.data;
    const contact = contacts.find(c => c.id === chatId);
    if (!contact) return;

    const cached = msgCache.get(chatId) ?? [];
    cached.push({ text, time, sent: false });
    msgCache.set(chatId, cached);

    if (activeId === chatId) {
      msgsSlot.insertAdjacentHTML('beforeend', createChatMessage(text, time, false));
      msgsSlot.scrollTop = msgsSlot.scrollHeight;
    } else {
      contact.unread = (contact.unread || 0) + 1;
      toastNotification({ title: contact.name, body: text, time });
    }

    contact.lastMessage = text;
    contact.time        = time;
    renderContacts();
  }

  // ── Personal inbox ping: a new or unseen chat sent us a message ───────
  function handleInboxPing(msg) {
    const chatId = msg.data?.chatId;
    if (!chatId) return;

    // If we're already subscribed to this chat, handleIncomingMessage covers it
    if (contacts.some(c => c.id === chatId)) return;

    // Unknown chat — fetch and add it
    ChatsService.getChats(userId).then(rows => {
      if (!Array.isArray(rows)) return;
      const row = rows.find(r => r.chat_id === chatId);
      if (!row) return;
      if (contacts.some(c => c.id === chatId)) return; // race guard
      addNewChat(row, contacts.length);
      renderContacts();
    }).catch(() => {});
  }

  // ── Add a newly discovered chat ───────────────────────────────────────
  function addNewChat(row, index) {
    const contact = apiChatToContact(row, index);
    msgCache.set(contact.id, (row.messages ?? []).map(m => apiMsgToMsg(m, userId)));
    contacts.push(contact);
    const unsub = subscribeToChat(contact.id, msg => handleIncomingMessage(contact.id, msg));
    unsubscribers.push(unsub);
  }

  sendBtn.addEventListener('click', sendMessage);
  inputField.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  // ── Filters ───────────────────────────────────────────────────────────
  filtersBar.addEventListener('click', e => {
    const btn = e.target.closest('.chat-filter');
    if (!btn) return;
    filtersBar.querySelectorAll('.chat-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterEstado = btn.dataset.filter;
    renderContacts();
  });

  // ── Search ────────────────────────────────────────────────────────────
  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    renderContacts();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    clearBtn.style.display = 'none';
    renderContacts();
    searchInput.focus();
  });

  // ── Render contact list ───────────────────────────────────────────────
  function renderContacts() {
    const term = searchTerm.toLowerCase();

    const filtered = contacts.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(term);
      const matchFilter = filterEstado === ''
        ? true
        : filterEstado === 'terminadas' ? c.closed : !c.closed;
      return matchSearch && matchFilter;
    });

    itemsSlot.innerHTML = filtered.map(c => createContactCard(c)).join('');

    if (activeId) {
      itemsSlot.querySelector(`.contact-card[data-id="${activeId}"]`)
        ?.classList.add('contact-card--active');
    }

    itemsSlot.querySelectorAll('.contact-card').forEach(card => {
      card.addEventListener('click', () => openChat(parseInt(card.dataset.id, 10)));
    });
  }

  // ── Open a conversation ───────────────────────────────────────────────
// ── Open a conversation ───────────────────────────────────────────────
  function openChat(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    activeId = id;
    sessionStorage.setItem('openChatId', activeId);

    contact.unread = 0;

    headerSlot.innerHTML = createChatHeader(contact);

    // Inject back button (visible only on mobile via CSS)
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'chat-back-btn';
    backBtn.innerHTML = BACK_ICON;
    backBtn.addEventListener('click', goBack);
    headerSlot.querySelector('.chat-header__left').prepend(backBtn);

    // ── Lógica del botón de Reporte ──────────────────────────────────────
    const btnReport = headerSlot.querySelector('.btn-report');
    updateReportes();
    if (btnReport) {
      // 1. Filtramos en el caché si este chat ya fue reportado por este usuario
      const yaReportado = userCache.reportes?.some(
        r => r.chat_id === activeId && r.id_usuario_reporta === userId
      );

      if (yaReportado) {
        // Deshabilitar el botón si ya hay un reporte
        btnReport.disabled = true;
        btnReport.title = 'Ya has reportado este chat';
        btnReport.style.opacity = '0.5';
        btnReport.style.cursor = 'not-allowed';
      } else {
        // 2. Si no está reportado, añadimos el evento para abrir el modal
        btnReport.addEventListener('click', () => {
          document.getElementById('chat-report-modal')?.remove();

          const modalEl = document.createElement('div');
          modalEl.id = 'chat-report-modal';
          modalEl.className = 'modal fade';
          modalEl.tabIndex = -1;
          modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content border-0 shadow rounded-4">
                <div class="modal-header border-bottom-0 pb-0">
                  <h5 class="modal-title fw-bold text-dark fs-5">Reportar a ${contact.name}</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body py-3">
                  <form id="form-reportar-usuario">
                    <div class="mb-3">
                      <label for="reporte-situacion" class="form-label fw-semibold text-secondary" style="font-size: 0.9rem;">
                        Describe la situación detalladamente:
                      </label>
                      <textarea id="reporte-situacion" class="form-control rounded-3" rows="4" 
                                placeholder="Ej. Comportamiento inadecuado, lenguaje ofensivo, incumplimiento de términos..." required></textarea>
                    </div>
                    <div class="d-flex gap-2 justify-content-end mt-4">
                      <button type="button" class="btn btn-light rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">Cancelar</button>
                      <button type="submit" id="btn-submit-reporte" class="btn text-white rounded-pill px-4 fw-semibold" style="background-color: var(--color-teal);">
                        Enviar Reporte
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          `;

          document.body.appendChild(modalEl);
          const bsModal = new bootstrap.Modal(modalEl);
          bsModal.show();

          const form = modalEl.querySelector('#form-reportar-usuario');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('#btn-submit-reporte');
            const situacionInput = form.querySelector('#reporte-situacion');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enviando...';

            try {
              await ReportesService.reportarUsuario({
                id_usuario_reporta: userId,
                id_usuario_reportado: contact.contactId,
                situacion: situacionInput.value.trim(),
                chat_id: activeId
              });

              bsModal.hide();
              toastContactoReportado(contact.name); 

              // 3. Actualizar caché local y deshabilitar botón al instante
              if (!userCache.reportes) userCache.reportes = [];
              userCache.reportes.push({
                chat_id: activeId,
                id_usuario_reporta: userId,
                id_usuario_reportado: contact.contactId
              });

              btnReport.disabled = true;
              btnReport.title = 'Ya has reportado este chat';
              btnReport.style.opacity = '0.5';
              btnReport.style.cursor = 'not-allowed';

            } catch (err) {
              console.error('[ChatReport] Error enviando el reporte:', err);
            } finally {
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }
          });

          modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
        });
      }
    }

    inputField.disabled = contact.closed;
    sendBtn.disabled = contact.closed;
    inputField.placeholder = contact.closed
      ? 'La negociación ha finalizado'
      : 'Escribe un mensaje...';

    layout.classList.add('chat--view-window');

    renderMessages(msgCache.get(id) ?? []);
    renderContacts();
  }

  // ── Go back to contact list (mobile) ─────────────────────────────────
  function goBack() {
    layout.classList.remove('chat--view-window');
    sessionStorage.removeItem('openChatId');
    activeId = null;
    msgsSlot.innerHTML = createEmptyState();
    headerSlot.innerHTML = '';
    inputField.disabled = false;
    sendBtn.disabled = false;
    inputField.placeholder = 'Escribe un mensaje...';
    renderContacts();
  }

  // ── Render messages ───────────────────────────────────────────────────
  function renderMessages(msgs) {
    msgsSlot.innerHTML = msgs.map(m => createChatMessage(m.text, m.time, m.sent)).join('');
    msgsSlot.scrollTop = msgsSlot.scrollHeight;
  }
}

export function cleanup() {
  _unsubscribers.forEach(fn => { try { fn(); } catch {} });
  _unsubscribers = [];
}

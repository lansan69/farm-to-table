import {
  createSearchBar,
  createContactCard,
  createChatHeader,
  createChatMessage,
  createMessageInput,
  createEmptyState,
  createContactSkeleton,
} from '../../../../../../assets/js/components/chat-components.js';
import { ChatsService } from '../../../../../../assets/js/services/chats.js';
import { initAbly, subscribeToChat, publishMessage } from '../../../../../../assets/js/ably.js';
import { toastNotification, toastContactoReportado } from '../../../../../../assets/js/toast.js';

const AVATAR_COLORS = ['#1B853F', '#00796B', '#85B72C', '#E74C3C', '#E67E22', '#9B59B6', '#3498DB', '#1ABC9C'];
const CLOSED_STATES  = ['aceptada', 'rechazada'];

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
  const closed   = CLOSED_STATES.includes(row.estado_negociacion);
  return {
    id:                row.chat_id,
    name:              row.contact_name + apellido,
    lastMessage:       row.last_message  || '',
    time:              formatContactTime(row.last_message_time),
    unread:            0,
    online:            false,
    color:             AVATAR_COLORS[index % AVATAR_COLORS.length],
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

export async function init(container) {
  const userId = parseInt(localStorage.getItem('token'), 10);

  let contacts    = [];
  let activeId    = null;
  let searchTerm  = '';
  let filterEstado = '';   // '' | 'en_curso' | 'terminadas'

  const msgCache = new Map();

  const searchSlot  = container.querySelector('#contact-search');
  const filtersBar  = container.querySelector('#chat-filters');
  const itemsSlot   = container.querySelector('#contact-items');
  const headerSlot  = container.querySelector('#chat-header');
  const msgsSlot    = container.querySelector('#chat-messages');
  const inputSlot   = container.querySelector('#chat-input');

  searchSlot.innerHTML = createSearchBar();
  inputSlot.innerHTML  = createMessageInput();
  msgsSlot.innerHTML   = createEmptyState();

  const inputField = inputSlot.querySelector('.message-input__field');
  const sendBtn    = inputSlot.querySelector('.message-input__send');

  // ── Load contact list ─────────────────────────────────────────────────
  itemsSlot.innerHTML = createContactSkeleton(7);
  try {
    const rows = await ChatsService.getChats(userId);
    contacts = rows.map((r, i) => {
      const contact = apiChatToContact(r, i);
      msgCache.set(contact.id, (r.messages ?? []).map(m => apiMsgToMsg(m, userId)));
      return contact;
    });
  } catch (err) {
    console.error('Error cargando chats:', err);
  }
  renderContacts();

  // Auto-open a specific chat if another page requested it
  const pendingChatId = sessionStorage.getItem('openChatId');
  if (pendingChatId) {
    sessionStorage.removeItem('openChatId');
    const id = parseInt(pendingChatId, 10);
    if (contacts.some(c => c.id === id)) openChat(id);
  }

  // ── Ably real-time ────────────────────────────────────────────────────
  try {
    await initAbly(userId);
    contacts.forEach(c => subscribeToChat(c.id, msg => handleIncomingMessage(c.id, msg)));
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
    const msg  = { text, time, sent: true };

    const cached = msgCache.get(activeId) ?? [];
    cached.push(msg);
    msgCache.set(activeId, cached);

    msgsSlot.insertAdjacentHTML('beforeend', createChatMessage(text, time, true));
    msgsSlot.scrollTop = msgsSlot.scrollHeight;

    contact.lastMessage = text;
    contact.time        = time;
    inputField.value    = '';
    inputField.focus();
    renderContacts();

    publishMessage(activeId, { text, time });
    ChatsService.sendMessage(activeId, userId, text).catch(err => {
      console.error('Error enviando mensaje:', err);
    });
  }

  // ── Incoming real-time messages ───────────────────────────────────────
  function handleIncomingMessage(chatId, msg) {
    if (msg.clientId === String(userId)) return;

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
  searchSlot.querySelector('.chat-search-bar__input').addEventListener('input', e => {
    searchTerm = e.target.value;
    renderContacts();
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
  function openChat(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    activeId       = id;
    contact.unread = 0;

    headerSlot.innerHTML = createChatHeader(contact);

    headerSlot.querySelector('.btn-report')?.addEventListener('click', () => {
      toastContactoReportado(contact.name);
    });

    // Lock input for closed negotiations
    inputField.disabled       = contact.closed;
    sendBtn.disabled          = contact.closed;
    inputField.placeholder    = contact.closed
      ? 'La negociación ha finalizado'
      : 'Escribe un mensaje...';

    renderMessages(msgCache.get(id) ?? []);
    renderContacts();
  }

  // ── Render messages ───────────────────────────────────────────────────
  function renderMessages(msgs) {
    msgsSlot.innerHTML = msgs.map(m => createChatMessage(m.text, m.time, m.sent)).join('');
    msgsSlot.scrollTop = msgsSlot.scrollHeight;
  }
}

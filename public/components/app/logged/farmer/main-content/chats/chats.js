import { farmerCache, updateChat } from '../../farmer.js';
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
  const apellido  = row.contact_apellido ? ` ${row.contact_apellido}` : '';
  const closed    = CLOSED_STATES.includes(row.estado_negociacion);
  // Derive the other user's ID from the two-participant columns
  const contactId = row.my_role === 'a'
    ? parseInt(row.usuario_b, 10)
    : parseInt(row.usuario_a, 10);
  return {
    id:                row.chat_id,
    contactId,
    name:              row.contact_name + apellido,
    lastMessage:       row.last_message       || '',
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

let _unsubscribers = [];

export async function init(container) {
  _unsubscribers = [];
  const userId = farmerCache.userId;

  let contacts     = [];
  let activeId     = null;
  let searchTerm   = '';
  let filterEstado = '';

  const msgCache = new Map();
  const unsubscribers = _unsubscribers;

  const layout     = container.querySelector('.farmer-chat');
  const searchSlot = container.querySelector('#contact-search');
  const filtersBar = container.querySelector('#chat-filters');
  const itemsSlot  = container.querySelector('#contact-items');
  const headerSlot = container.querySelector('#chat-header');
  const msgsSlot   = container.querySelector('#chat-messages');
  const inputSlot  = container.querySelector('#chat-input');

  searchSlot.innerHTML = createSearchBar();
  inputSlot.innerHTML  = createMessageInput();
  msgsSlot.innerHTML   = createEmptyState();

  const inputField = inputSlot.querySelector('.message-input__field');
  const sendBtn    = inputSlot.querySelector('.message-input__send');

  // ── Build contacts from cache (instant render) ────────────────────────
  const cachedRows = farmerCache.chats ?? [];
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
    if (contacts.some(c => c.id === id)) openChat(id);
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

  // ── Background refresh: catch stale last-messages + new chats ─────────
  ChatsService.getChats(userId).then(freshRows => {
    if (!Array.isArray(freshRows)) return;
    const knownIds = new Set(contacts.map(c => c.id));
    let changed = false;

    freshRows.forEach((r, i) => {
      if (knownIds.has(r.chat_id)) {
        // Update stale last-message for non-active contacts
        const c = contacts.find(c => c.id === r.chat_id);
        if (c && r.last_message !== undefined && r.last_message !== c.lastMessage) {
          c.lastMessage = r.last_message || '';
          c.time        = formatContactTime(r.last_message_time);
          if (c.id !== activeId) {
            msgCache.set(c.id, (r.messages ?? []).map(m => apiMsgToMsg(m, userId)));
          }
          changed = true;
        }
      } else {
        // Brand-new chat that wasn't in the shell cache
        addNewChat(r, contacts.length + i);
        changed = true;
      }
    });

    if (changed) renderContacts();
  }).catch(() => {});

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

    publishMessage(activeId, { text, time });

    // Ping recipient's inbox so their contact list updates instantly
    if (contact.contactId) {
      notifyInbox(contact.contactId, activeId).catch(() => {});
    }

    ChatsService.sendMessage(activeId, userId, text).catch(err => {
      console.error('Error enviando mensaje:', err);
    });

    updateChat();
  }

  // ── Incoming real-time message on a subscribed chat channel ───────────
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

    headerSlot.querySelector('.btn-report')?.addEventListener('click', () => {
      toastContactoReportado(contact.name);
    });

    inputField.disabled    = contact.closed;
    sendBtn.disabled       = contact.closed;
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

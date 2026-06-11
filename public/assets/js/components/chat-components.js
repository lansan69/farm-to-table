// ── Reusable Chat UI Factories ────────────────────────────────────────────
// Each function returns an HTML string ready to be injected with innerHTML.

const SEARCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

const SEND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;

/**
 * Search bar for the contact list.
 * @param {string} placeholder
 */
export function createSearchBar(placeholder = 'Buscar chat...') {
  return `
    <div class="chat-search-bar">
      <span class="chat-search-bar__icon">${SEARCH_ICON}</span>
      <input type="text" class="chat-search-bar__input" placeholder="${placeholder}">
    </div>
  `;
}

/**
 * Contact card for the contact list.
 * @param {{ id, name, lastMessage, time, unread, color }} contact
 */
export function createContactCard(contact) {
  const badge = contact.unread
    ? `<span class="contact-card__badge">${contact.unread}</span>`
    : '';
  return `
    <div class="contact-card" data-id="${contact.id}">
      <div class="contact-card__avatar" style="background:${contact.color}">
        ${contact.name[0].toUpperCase()}
      </div>
      <div class="contact-card__body">
        <div class="contact-card__top">
          <span class="contact-card__name">${contact.name}</span>
          <span class="contact-card__time">${contact.time}</span>
        </div>
        <div class="contact-card__bottom">
          <span class="contact-card__preview">${contact.lastMessage}</span>
          ${badge}
        </div>
      </div>
    </div>
  `;
}

/**
 * Red report button shown in the chat header.
 */
export function createReportButton() {
  return `<button class="btn-report" type="button">Reportar</button>`;
}

/**
 * Chat window header with avatar, name, status and report button.
 * Shows a "Negociación finalizada" badge when contact.closed is true.
 * @param {{ name, online, color, closed }} contact
 */
export function createChatHeader(contact) {
  const closedBadge = contact.closed
    ? `<span class="chat-header__closed-badge">Negociación finalizada</span>`
    : '';
  return `
    <div class="chat-header">
      <div class="chat-header__left">
        <div class="chat-header__avatar" style="background:${contact.color}">
          ${contact.name[0].toUpperCase()}
        </div>
        <div class="chat-header__info">
          <span class="chat-header__name">${contact.name}</span>
          <span class="chat-header__status ${contact.online ? 'chat-header__status--online' : ''}">
            ${contact.online ? 'En línea' : 'Desconectado'}
          </span>
        </div>
      </div>
      <div class="chat-header__actions">
        ${closedBadge}
        ${createReportButton()}
      </div>
    </div>
  `;
}

/**
 * Single chat message bubble.
 * @param {string} text
 * @param {string} time
 * @param {boolean} isSent
 */
export function createChatMessage(text, time, isSent) {
  return `
    <div class="chat-message chat-message--${isSent ? 'sent' : 'received'}">
      <p class="chat-message__text">${text}</p>
      <span class="chat-message__time">${time}</span>
    </div>
  `;
}

/**
 * Message input bar with text field and send button.
 */
export function createMessageInput() {
  return `
    <div class="message-input">
      <input type="text" class="message-input__field" placeholder="Escribe un mensaje...">
      <button class="message-input__send" type="button">${SEND_ICON}</button>
    </div>
  `;
}

/**
 * Placeholder shown when no conversation is open.
 */
export function createEmptyState() {
  return `
    <div class="chat-empty-state">
      <div class="chat-empty-state__icon">💬</div>
      <p class="chat-empty-state__text">Selecciona un chat para comenzar</p>
    </div>
  `;
}

/**
 * Skeleton loader for the contact list while chats are being fetched.
 * @param {number} count  Number of placeholder cards to show
 */
export function createContactSkeleton(count = 6) {
  const card = `
    <div class="skeleton-contact-card">
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton-contact-body">
        <div class="skeleton skeleton-line skeleton-line--name"></div>
        <div class="skeleton skeleton-line skeleton-line--preview"></div>
      </div>
    </div>
  `;
  return card.repeat(count);
}

/**
 * Skeleton loader for the messages panel while a chat's history is being fetched.
 */
export function createMessagesSkeleton() {
  return `
    <div class="skeleton-messages">
      <div class="skeleton-msg skeleton-msg--received">
        <div class="skeleton skeleton-bubble skeleton-bubble--lg"></div>
      </div>
      <div class="skeleton-msg skeleton-msg--sent">
        <div class="skeleton skeleton-bubble skeleton-bubble--md"></div>
      </div>
      <div class="skeleton-msg skeleton-msg--received">
        <div class="skeleton skeleton-bubble skeleton-bubble--sm"></div>
      </div>
      <div class="skeleton-msg skeleton-msg--sent">
        <div class="skeleton skeleton-bubble skeleton-bubble--lg"></div>
      </div>
      <div class="skeleton-msg skeleton-msg--received">
        <div class="skeleton skeleton-bubble skeleton-bubble--md"></div>
      </div>
    </div>
  `;
}

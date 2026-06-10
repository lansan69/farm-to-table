import { Http } from '../http.js';

export const ChatsService = {
  /**
   * All chats where the user appears as usuario_a or usuario_b.
   * Each row includes the other party's name and the last message preview.
   */
  getChats(userId) {
    return Http.get('chats.php', { usuario_id: userId });
  },

  /**
   * All messages in a chat ordered chronologically (ASC).
   */
  getMessages(chatId) {
    return Http.get('chats.php', { chat_id: chatId });
  },

  /**
   * Sends a message in a chat.
   * @param {number} chatId
   * @param {number} remitenteId  — the logged-in user's id_usuario
   * @param {string} body
   */
  sendMessage(chatId, remitenteId, body) {
    return Http.post('chats.php', { chat_id: chatId, remitente_id: remitenteId, body });
  },
};

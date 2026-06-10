import { Http } from '../http.js';

export const ChatsService = {
  getChats(userId) {
    return Http.get('chats.php', { usuario_id: userId });
  },

  getMessages(chatId) {
    return Http.get('chats.php', { chat_id: chatId });
  },

  sendMessage(chatId, remitenteId, body) {
    return Http.post('chats.php', { chat_id: chatId, remitente_id: remitenteId, body });
  },

  /**
   * Returns the chat_id for a negotiation, creating the chat if it doesn't exist.
   */
  findOrCreate(usuarioA, usuarioB, idNegociacion) {
    return Http.post('chats.php', {
      action:         'find_or_create',
      usuario_a:      usuarioA,
      usuario_b:      usuarioB,
      id_negociacion: idNegociacion,
    });
  },
};

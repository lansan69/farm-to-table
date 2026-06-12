let _client = null;

async function fetchAblyApiKey() {
  const res  = await fetch('/dashboard/farm-to-table/src/api/config.php');
  const json = await res.json();
  if (!json?.data?.ably_api_key) throw new Error('Ably API key no disponible.');
  return json.data.ably_api_key;
}

export async function initAbly(userId) {
  if (_client) return _client;
  const apiKey = await fetchAblyApiKey();
  _client = new Ably.Realtime({ key: apiKey, clientId: String(userId) });
  return _client;
}

export function subscribeToChat(chatId, onMessage) {
  const channel = _client.channels.get(`chat:${chatId}`);
  channel.subscribe('message', onMessage);
  return () => channel.unsubscribe('message', onMessage);
}

export function publishMessage(chatId, payload) {
  return _client.channels.get(`chat:${chatId}`).publish('message', payload);
}

// Personal inbox channel — used to notify a user about new/updated chats
// even when they are not subscribed to that specific chat channel yet.
export function subscribeToInbox(userId, onPing) {
  const channel = _client.channels.get(`inbox:${userId}`);
  channel.subscribe('ping', onPing);
  return () => channel.unsubscribe('ping', onPing);
}

export function notifyInbox(recipientId, chatId) {
  return _client.channels.get(`inbox:${recipientId}`).publish('ping', { chatId });
}

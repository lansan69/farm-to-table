<?php
require_once __DIR__ . '/../models/ChatModel.php';

class ChatDomain
{
    private ChatModel $model;

    public function __construct()
    {
        $this->model = new ChatModel();
    }

    /**
     * Returns all chats for $userId with every message already nested inside.
     * Two queries total: one for chats, one IN for all their messages.
     */
    public function getChats(int $userId): array
    {
        $chats = $this->model->findByUsuario($userId);
        if (empty($chats)) return [];

        $chatIds  = array_column($chats, 'chat_id');
        $messages = $this->model->findMessagesByChatIds($chatIds);

        // Group messages by chat_id
        $grouped = [];
        foreach ($messages as $msg) {
            $grouped[$msg['chat_id']][] = $msg;
        }

        // Embed messages into each chat row
        foreach ($chats as &$chat) {
            $chat['messages'] = $grouped[$chat['chat_id']] ?? [];
        }

        return $chats;
    }

    public function getMessages(int $chatId): array
    {
        return $this->model->findMessages($chatId);
    }

    public function sendMessage(int $chatId, int $remitenteId, string $body): array
    {
        $id = $this->model->sendMessage($chatId, $remitenteId, $body);
        return ['id' => $id];
    }
}

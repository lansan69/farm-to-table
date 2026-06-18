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
     */
    public function getChats(int $userId): array
    {
        $chats = $this->model->findByUsuario($userId);
        if (empty($chats)) return [];

        $chatIds  = array_column($chats, 'chat_id');
        $messages = $this->model->findMessagesByChatIds($chatIds);

        $grouped = [];
        foreach ($messages as $msg) {
            $grouped[$msg['chat_id']][] = $msg;
        }

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

    /**
     * Returns the existing chat id for a negotiation, or creates one.
     */
    public function findOrCreate(int $a, int $b, int $idNegociacion): int
    {
        $existing = $this->model->findByNegociacion($idNegociacion);
        if ($existing !== null) return $existing;

        try {
            return $this->model->create($a, $b, $idNegociacion);
        } catch (\PDOException $e) {
            // Race condition: another request created it first
            $existing = $this->model->findByNegociacion($idNegociacion);
            if ($existing !== null) return $existing;
            throw $e;
        }
    }
}

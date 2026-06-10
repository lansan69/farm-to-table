<?php
require_once __DIR__ . '/BaseModel.php';

class ChatModel extends BaseModel
{
    /**
     * All chats where $userId appears as either usuario_a or usuario_b,
     * enriched with the contact's name, last message, and negotiation status.
     */
    public function findByUsuario(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
               c.id                  AS chat_id,
               c.usuario_a,
               c.usuario_b,
               c.id_negociacion,
               IF(c.usuario_a = ?, \'a\', \'b\') AS my_role,
               u.nombre_razon_social  AS contact_name,
               u.apellido             AS contact_apellido,
               m.body                 AS last_message,
               m.fecha_enviado        AS last_message_time,
               COALESCE(v.estado_negociacion, \'pendiente\') AS estado_negociacion
             FROM chats c
             JOIN usuarios u ON u.id_usuario = IF(c.usuario_a = ?, c.usuario_b, c.usuario_a)
             LEFT JOIN mensajes m ON m.id = (
               SELECT id FROM mensajes
               WHERE chat_id = c.id
               ORDER BY fecha_enviado DESC
               LIMIT 1
             )
             LEFT JOIN v_negociaciones_detalle v ON v.id_negociacion = c.id_negociacion
             WHERE c.usuario_a = ? OR c.usuario_b = ?
             ORDER BY COALESCE(m.fecha_enviado, c.created_at) DESC'
        );
        $stmt->execute([$userId, $userId, $userId, $userId]);
        return $stmt->fetchAll();
    }

    /**
     * All messages of a chat ordered chronologically.
     */
    public function findMessages(int $chatId): array
    {
        $stmt = $this->db->prepare(
            'SELECT chat_id, remitente_id, body, fecha_enviado
             FROM mensajes
             WHERE chat_id = ?
             ORDER BY fecha_enviado ASC'
        );
        $stmt->execute([$chatId]);
        return $stmt->fetchAll();
    }

    /**
     * All messages for a set of chats in one query, ordered chronologically.
     */
    public function findMessagesByChatIds(array $ids): array
    {
        if (empty($ids)) return [];
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->db->prepare(
            "SELECT chat_id, remitente_id, body, fecha_enviado
             FROM mensajes
             WHERE chat_id IN ($placeholders)
             ORDER BY chat_id, fecha_enviado ASC"
        );
        $stmt->execute($ids);
        return $stmt->fetchAll();
    }

    /**
     * Returns the chat id tied to a specific negotiation, or null.
     */
    public function findByNegociacion(int $idNegociacion): ?int
    {
        $stmt = $this->db->prepare(
            'SELECT id FROM chats WHERE id_negociacion = ? LIMIT 1'
        );
        $stmt->execute([$idNegociacion]);
        $row = $stmt->fetch();
        return $row ? (int) $row['id'] : null;
    }

    /**
     * Creates a new chat linked to a negotiation and returns its id.
     */
    public function create(int $a, int $b, int $idNegociacion): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO chats (usuario_a, usuario_b, id_negociacion) VALUES (?, ?, ?)'
        );
        $stmt->execute([$a, $b, $idNegociacion]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Inserts a new message and returns its generated id.
     */
    public function sendMessage(int $chatId, int $remitenteId, string $body): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO mensajes (chat_id, remitente_id, body)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([$chatId, $remitenteId, $body]);
        return (int) $this->db->lastInsertId();
    }
}

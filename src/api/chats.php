<?php
// Endpoint: /src/api/chats.php
//
// GET  ?usuario_id=N          → chats where user N is usuario_a or usuario_b
// GET  ?chat_id=N             → messages in chat N ordered by fecha_enviado ASC
//
// POST {chat_id, remitente_id, body}  → send a message, returns {id}

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/ChatDomain.php';

$domain = new ChatDomain();

match (Router::method()) {
    'GET'  => handleGet($domain),
    'POST' => handlePost($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(ChatDomain $domain): void
{
    if (($id = Router::query('usuario_id')) !== null) {
        json_ok($domain->getChats((int) $id));
    }

    if (($id = Router::query('chat_id')) !== null) {
        json_ok($domain->getMessages((int) $id));
    }

    json_error('Se requiere usuario_a o chat_id.', 400);
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(ChatDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['chat_id', 'remitente_id', 'body'], $body);

    $result = $domain->sendMessage(
        chatId:      (int)    $body['chat_id'],
        remitenteId: (int)    $body['remitente_id'],
        body:        (string) $body['body']
    );

    json_ok($result, 201);
}

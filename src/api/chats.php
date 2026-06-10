<?php
// Endpoint: /src/api/chats.php
//
// GET  ?usuario_id=N                                       → all chats for user
// GET  ?chat_id=N                                          → messages in chat N
//
// POST {action:'find_or_create', usuario_a, usuario_b,
//       id_negociacion}                                    → {chat_id}
// POST {chat_id, remitente_id, body}                       → send a message

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

    json_error('Se requiere usuario_id o chat_id.', 400);
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(ChatDomain $domain): void
{
    $body   = Router::body();
    $action = $body['action'] ?? null;

    if ($action === 'find_or_create') {
        Router::requireFields(['usuario_a', 'usuario_b', 'id_negociacion'], $body);
        $chatId = $domain->findOrCreate(
            (int) $body['usuario_a'],
            (int) $body['usuario_b'],
            (int) $body['id_negociacion']
        );
        json_ok(['chat_id' => $chatId]);
    }

    Router::requireFields(['chat_id', 'remitente_id', 'body'], $body);
    $result = $domain->sendMessage(
        chatId:      (int)    $body['chat_id'],
        remitenteId: (int)    $body['remitente_id'],
        body:        (string) $body['body']
    );
    json_ok($result, 201);
}

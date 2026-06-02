<?php
// Endpoint: /src/api/favoritos.php
//
// GET  ?id_usuario=N                     → lotes marcados como favoritos por el usuario
// POST {id_usuario, id_lote}             → agrega o elimina el favorito (toggle)

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/MarketplaceDomain.php';

$domain = new MarketplaceDomain();

match (Router::method()) {
    'GET'  => handleGet($domain),
    'POST' => handlePost($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(MarketplaceDomain $domain): void
{
    $idUsuario = Router::query('id_usuario');
    if ($idUsuario === null) {
        json_error('Se requiere id_usuario.', 422);
    }

    json_ok($domain->getFavoritos((int) $idUsuario));
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(MarketplaceDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['id_usuario', 'id_lote'], $body);

    $result = $domain->toggleFavorito(
        idUsuario: (int) $body['id_usuario'],
        idLote:    (int) $body['id_lote']
    );

    json_ok($result);
}

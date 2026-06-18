<?php
// Endpoint: /src/api/zonas.php  (uso exclusivo del panel admin)
//
// GET               → todas las zonas (incluyendo inactivas)
// GET  ?id=N        → una zona por ID
// POST              → crear zona   { nombre_delegacion, codigo_postal }
// PATCH             → editar zona  { id_zona, nombre_delegacion, codigo_postal }
// DELETE            → toggle activa/inactiva  { id_zona }

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/ZonaDomain.php';

$domain = new ZonaDomain();

match (Router::method()) {
    'GET'    => handleGet($domain),
    'POST'   => handlePost($domain),
    'PATCH'  => handlePatch($domain),
    'DELETE' => handleDelete($domain),
    default  => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(ZonaDomain $domain): void
{
    $id = Router::query('id');
    if ($id !== null) {
        $zona = $domain->getById((int) $id);
        $zona === null
            ? json_error('Zona no encontrada.', 404)
            : json_ok($zona);
    }
    json_ok($domain->getAll());
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(ZonaDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['nombre_delegacion', 'codigo_postal'], $body);

    $result = $domain->create($body['nombre_delegacion'], $body['codigo_postal']);
    $result['success']
        ? json_ok(['id_zona' => $result['id_zona']])
        : json_error($result['message'], 422);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

function handlePatch(ZonaDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['id_zona', 'nombre_delegacion', 'codigo_postal'], $body);

    $result = $domain->update((int) $body['id_zona'], $body['nombre_delegacion'], $body['codigo_postal']);
    $result['success']
        ? json_ok([])
        : json_error($result['message'], 422);
}

// ── DELETE ────────────────────────────────────────────────────────────────────

function handleDelete(ZonaDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['id_zona'], $body);

    $result = $domain->toggle((int) $body['id_zona']);
    $result['success']
        ? json_ok([])
        : json_error($result['message'], 422);
}

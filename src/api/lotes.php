<?php
// Endpoint: /src/api/lotes.php  (panel del productor)
//
// GET  ?id_productor=N                   → lotes publicados por el productor
// GET  ?id_lote=N                        → detalle completo de un lote
// GET  ?urgentes=1                       → lotes próximos a caducar
// POST {id_productor, id_producto,
//       cantidad, fecha_cosecha,
//       precio, fotos?:[]}               → publicar nuevo lote
// PATCH {id_lote, id_productor, estado}  → cambiar estado del lote

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/LoteDomain.php';

$domain = new LoteDomain();

match (Router::method()) {
    'GET'   => handleGet($domain),
    'POST'  => handlePost($domain),
    'PATCH' => handlePatch($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(LoteDomain $domain): void
{
    // ?urgentes=1 → lotes con 0–3 días de vida útil restantes
    if (Router::query('urgentes')) {
        json_ok($domain->getLotesUrgentes());
    }

    // ?id_lote=N → detalle completo (datos + fotos + trazabilidad)
    $idLote = Router::query('id_lote');
    if ($idLote !== null) {
        $lote = $domain->getDetalleLote((int) $idLote);
        empty($lote)
            ? json_error('Lote no encontrado.', 404)
            : json_ok($lote);
    }

    // ?id_productor=N → mis lotes (panel del productor)
    $idProductor = Router::query('id_productor');
    if ($idProductor !== null) {
        json_ok($domain->getLotesProductor((int) $idProductor));
    }

    json_error('Se requiere id_productor, id_lote o urgentes.', 400);
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(LoteDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['id_productor', 'id_producto', 'cantidad', 'fecha_cosecha', 'precio'], $body);

    $result = $domain->publicarLote(
        idProductor:  (int)   $body['id_productor'],
        idProducto:   (int)   $body['id_producto'],
        cantidad:     (float) $body['cantidad'],
        fechaCosecha:         $body['fecha_cosecha'],
        precio:       (float) $body['precio'],
        fotosUrls:            $body['fotos'] ?? []
    );

    $result['success']
        ? json_ok(['id_lote' => $result['id_lote']], 201)
        : json_error($result['message'], 500);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

function handlePatch(LoteDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['id_lote', 'id_productor', 'estado'], $body);

    $ok = $domain->cambiarEstadoLote(
        idLote:      (int) $body['id_lote'],
        idProductor: (int) $body['id_productor'],
        estado:            $body['estado']
    );

    $ok
        ? json_ok()
        : json_error('No se pudo actualizar el estado. Verifica que el lote te pertenezca y que el estado sea válido.', 422);
}

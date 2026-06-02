<?php
// Endpoint: /src/api/entregas.php
//
// GET  ?id_negociacion=N                 → entrega asociada a una negociación
// GET  ?qr=CODIGO                        → busca entrega por código QR (previa a confirmar)
//
// POST {action:'confirmar', codigo_qr}   → el comprador confirma la recepción escaneando QR
//
// PATCH {action:'estado',
//        id_entrega, estado}             → actualiza el estado logístico (productor/admin)

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/EntregaDomain.php';

$domain = new EntregaDomain();

match (Router::method()) {
    'GET'   => handleGet($domain),
    'POST'  => handlePost($domain),
    'PATCH' => handlePatch($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(EntregaDomain $domain): void
{
    // ?qr=CODIGO → busca la entrega antes de confirmar (comprador escanea QR)
    $qr = Router::query('qr');
    if ($qr !== null) {
        $entrega = $domain->verificarQR($qr);
        $entrega === null
            ? json_error('Código QR no válido.', 404)
            : json_ok($entrega);
    }

    // ?id_negociacion=N → entrega ligada a esa negociación
    $idNegociacion = Router::query('id_negociacion');
    if ($idNegociacion !== null) {
        $entrega = $domain->getEntregaPorNegociacion((int) $idNegociacion);
        $entrega === null
            ? json_error('Entrega no encontrada.', 404)
            : json_ok($entrega);
    }

    json_error('Se requiere id_negociacion o qr.', 400);
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(EntregaDomain $domain): void
{
    $body   = Router::body();
    $action = $body['action'] ?? '';

    match ($action) {
        'confirmar' => confirmarRecepcion($domain, $body),
        default     => json_error('Acción no reconocida.', 400),
    };
}

function confirmarRecepcion(EntregaDomain $domain, array $body): void
{
    Router::requireFields(['codigo_qr'], $body);

    $result = $domain->confirmarRecepcion($body['codigo_qr']);

    $result['success']
        ? json_ok(['id_entrega' => $result['id_entrega']])
        : json_error($result['message'], 422);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

function handlePatch(EntregaDomain $domain): void
{
    $body   = Router::body();
    $action = $body['action'] ?? '';

    match ($action) {
        'estado' => actualizarEstado($domain, $body),
        default  => json_error('Acción no reconocida.', 400),
    };
}

function actualizarEstado(EntregaDomain $domain, array $body): void
{
    Router::requireFields(['id_entrega', 'estado'], $body);

    $ok = $domain->actualizarEstado((int) $body['id_entrega'], $body['estado']);

    $ok
        ? json_ok()
        : json_error('Estado no válido o entrega no encontrada.', 422);
}

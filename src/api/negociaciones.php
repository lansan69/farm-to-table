<?php
// Endpoint: /src/api/negociaciones.php
//
// GET  ?id_comprador=N                   → negociaciones activas del comprador
// GET  ?id_productor=N                   → negociaciones activas del productor
// GET  ?hilo=N                           → hilo de ofertas de una negociación
// GET  ?historial_comprador=N            → historial completo de compras
// GET  ?historial_productor=N            → historial completo de ventas
//
// POST {action:'iniciar',
//       id_lote, id_comprador,
//       monto, comentario?}              → inicia negociación con primera oferta
//
// POST {action:'contraoferta',
//       id_negociacion, id_emisor,
//       monto, comentario?}              → envía ronda de contraoferta
//
// PATCH {action:'aceptar',
//        id_negociacion}                 → acepta la última oferta
//
// PATCH {action:'rechazar',
//        id_negociacion}                 → rechaza y cierra la negociación

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/NegociacionDomain.php';

$domain = new NegociacionDomain();

match (Router::method()) {
    'GET'   => handleGet($domain),
    'POST'  => handlePost($domain),
    'PATCH' => handlePatch($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(NegociacionDomain $domain): void
{
    if (($id = Router::query('hilo')) !== null) {
        json_ok($domain->getHiloOfertas((int) $id));
    }

    if (($id = Router::query('historial_comprador')) !== null) {
        json_ok($domain->getHistorialComprador((int) $id));
    }

    if (($id = Router::query('historial_productor')) !== null) {
        json_ok($domain->getHistorialProductor((int) $id));
    }

    if (($id = Router::query('id_comprador')) !== null) {
        json_ok($domain->getNegociacionesComprador((int) $id));
    }

    if (($id = Router::query('id_productor')) !== null) {
        json_ok($domain->getNegociacionesProductor((int) $id));
    }

    json_error('Se requiere al menos un parámetro de filtro.', 400);
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(NegociacionDomain $domain): void
{
    $body   = Router::body();
    $action = $body['action'] ?? '';

    match ($action) {
        'iniciar'      => iniciar($domain, $body),
        'contraoferta' => contraoferta($domain, $body),
        default        => json_error('Acción no reconocida.', 400),
    };
}

function iniciar(NegociacionDomain $domain, array $body): void
{
    Router::requireFields(['id_lote', 'id_comprador', 'monto'], $body);

    $result = $domain->iniciarNegociacion(
        idLote:      (int)   $body['id_lote'],
        idComprador: (int)   $body['id_comprador'],
        monto:       (float) $body['monto'],
        comentario:          $body['comentario'] ?? null
    );

    json_ok(['id_negociacion' => $result['id_negociacion']], 201);
}

function contraoferta(NegociacionDomain $domain, array $body): void
{
    Router::requireFields(['id_negociacion', 'id_emisor', 'monto'], $body);

    $result = $domain->enviarContraoferta(
        idNegociacion: (int)   $body['id_negociacion'],
        idEmisor:      (int)   $body['id_emisor'],
        monto:         (float) $body['monto'],
        comentario:            $body['comentario'] ?? null
    );

    $result['success']
        ? json_ok()
        : json_error($result['message'], 422);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

function handlePatch(NegociacionDomain $domain): void
{
    $body   = Router::body();
    $action = $body['action'] ?? '';

    Router::requireFields(['id_negociacion'], $body);
    $idNegociacion = (int) $body['id_negociacion'];

    match ($action) {
        'aceptar' => $domain->aceptar($idNegociacion)
            ? json_ok()
            : json_error('No se pudo aceptar la negociación.', 500),
        'rechazar' => $domain->rechazar($idNegociacion)
            ? json_ok()
            : json_error('No se pudo rechazar la negociación.', 500),
        default => json_error('Acción no reconocida.', 400),
    };
}

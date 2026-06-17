<?php
// Endpoint: /src/api/reportes.php
//
// GET  (sin params)       → todos los reportes ordenados por fecha descendente
// GET  ?search_term=x     → buscar término (parcial) en nombres o correos de ambos usuarios
// GET  ?id_reporta=N      → filtrar reportes creados por un usuario específico
// GET  ?id_reportado=N    → filtrar reportes dirigidos a un usuario específico
// GET  ?fecha=YYYY-MM-DD  → filtrar reportes creados en una fecha exacta
//
// Todos los filtros son acumulables entre sí.

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/ReporteDomain.php';

$domain = new ReporteDomain();

match (Router::method()) {
    'GET'   => handleGet($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(ReporteDomain $domain): void
{
    // Recuperar parámetros de la query con sus tipos correctos
    $searchTerm = Router::query('search_term');
    $idReporta  = Router::query('id_reporta');
    $idReportado = Router::query('id_reportado');
    $fecha       = Router::query('fecha');

    // Listado de reportes con filtros opcionales aplicados
    json_ok($domain->getReportes(
        search_term: $searchTerm !== null && trim($searchTerm) !== '' ? (string)$searchTerm : null,
        id_reporta: $idReporta !== null ? (int)$idReporta : null,
        id_reportado: $idReportado !== null ? (int)$idReportado : null,
        fecha: $fecha !== null && trim($fecha) !== '' ? (string)$fecha : null
    ));
}
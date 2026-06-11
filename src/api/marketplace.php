<?php
// Endpoint: /src/api/marketplace.php
//
// GET  (sin params)                      → todos los lotes disponibles
// GET  ?nombre=x&categoria=N&zona=N      → búsqueda con filtros opcionales
// GET  ?id=N                             → detalle de un lote
// GET  ?categorias=1                     → lista de categorías para el filtro

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/MarketplaceDomain.php';

$domain = new MarketplaceDomain();

match (Router::method()) {
    'GET'  => handleGet($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(MarketplaceDomain $domain): void
{
    // ?categorias=1 → lista de categorías para poblar el filtro en la UI
    if (Router::query('categorias')) {
        json_ok($domain->getCategorias());
    }

    // ?id=N → detalle completo de un lote
    $id = Router::query('id');
    if ($id !== null) {
        $lote = $domain->getDetalleLote((int) $id);
        $lote === null
            ? json_error('Lote no encontrado.', 404)
            : json_ok($lote);
    }

    // Sin id → listado con filtros opcionales
    $lotes = $domain->getLotes(
        nombre:      Router::query('nombre'),
        idCategoria: ($c = Router::query('categoria')) !== null ? (int) $c : null
    );

    json_ok($lotes);
}

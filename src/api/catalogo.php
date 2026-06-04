<?php
// Endpoint: /src/api/catalogo.php
//
// GET  (sin params)                      → catálogo completo de productos
// GET  ?q=texto                          → búsqueda por nombre (autocomplete)
// GET  ?categorias=1                     → lista de categorías

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/LoteDomain.php';

$domain = new LoteDomain();

match (Router::method()) {
    'GET'  => handleGet($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(LoteDomain $domain): void
{
    // ?categorias=1 → categorías para selectores en formularios
    if (Router::query('categorias')) {
        json_ok($domain->getCategorias());
    }

    // ?q=texto → búsqueda parcial por nombre (para autocomplete en publicar-lote)
    $q = Router::query('q');
    if ($q !== null) {
        json_ok($domain->buscarProductos(trim($q)));
    }

    // Sin parámetros → catálogo completo
    json_ok($domain->getCatalogo());
}

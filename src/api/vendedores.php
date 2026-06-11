<?php
// Endpoint: /src/api/vendedores.php
//
// GET  (sin params)   → lista de todos los vendedores (v_vendedores)
// GET  ?id=N          → detalle de un vendedor

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../models/VendedorModel.php';

$model = new VendedorModel();

match (Router::method()) {
    'GET'  => handleGet($model),
    default => json_error('Método no permitido.', 405),
};

function handleGet(VendedorModel $model): void
{
    $id = Router::query('id');
    if ($id !== null) {
        $v = $model->findById((int) $id);
        $v === null
            ? json_error('Vendedor no encontrado.', 404)
            : json_ok($v);
    }

    json_ok($model->findAll());
}

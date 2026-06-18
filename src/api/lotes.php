<?php
// Endpoint: /src/api/lotes.php  (panel del productor)

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/LoteDomain.php';

$domain = new LoteDomain();

match (Router::method()) {
    'GET'   => handleGet($domain),
    'POST'  => Router::query('action') === 'editar' ? handleEdit($domain) : handlePost($domain),
    'PATCH' => handlePatch($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(LoteDomain $domain): void
{
    if (Router::query('urgentes')) {
        json_ok($domain->getLotesUrgentes());
    }

    $idLote = Router::query('id_lote');
    if ($idLote !== null) {
        $lote = $domain->getDetalleLote((int) $idLote);
        empty($lote)
            ? json_error('Lote no encontrado.', 404)
            : json_ok($lote);
    }

    $idProductor = Router::query('id_productor');
    if ($idProductor !== null) {
        json_ok($domain->getLotesProductor((int) $idProductor));
    }

    json_error('Se requiere id_productor, id_lote o urgentes.', 400);
}

// ── POST (Crear) ──────────────────────────────────────────────────────────────

function handlePost(LoteDomain $domain): void
{
    $body = $_POST; 
    Router::requireFields(['id_productor', 'nombre', 'categoria_id', 'cantidad', 'precio_sugerido', 'fecha'], $body);

    $fotoNombre = null;
    
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
        $fotoNombre = uniqid('lote_') . '.' . $ext;
        $destino = __DIR__ . '/../../public/assets/images/lotes/' . $fotoNombre; 
        move_uploaded_file($_FILES['foto']['tmp_name'], $destino);
    }

    $result = $domain->publicarLote(
        idProductor:  (int)   $body['id_productor'],
        nombre:       (string)$body['nombre'],
        idCategoria:  (int)   $body['categoria_id'],
        cantidad:     (float) $body['cantidad'],
        precio:       (float) $body['precio_sugerido'],
        fechaCosecha: (string)$body['fecha'],
        descripcion:  $body['descripcion'] ?? null,
        foto:         $fotoNombre,
        idProducto:   $body['id_producto'] ?? null
    );

    $result['success']
        ? json_ok(['id_lote' => $result['id_lote'], 'foto_nombre' => $fotoNombre], 201)
        : json_error($result['message'], 500);
}

// ── POST (Editar) ─────────────────────────────────────────────────────────────

function handleEdit(LoteDomain $domain): void
{
    $body = $_POST;
    // Exigimos id_lote para saber cuál editar
    Router::requireFields(['id_lote', 'id_productor', 'nombre', 'categoria_id', 'cantidad', 'precio_sugerido', 'fecha'], $body);

    $fotoNombre = null;
    
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
        $fotoNombre = uniqid('lote_edit_') . '.' . $ext;
        $destino = __DIR__ . '/../../public/assets/images/lotes/' . $fotoNombre; 
        move_uploaded_file($_FILES['foto']['tmp_name'], $destino);
    }

    $result = $domain->actualizarLote(
        idLote:       (int)   $body['id_lote'],
        idProductor:  (int)   $body['id_productor'],
        nombre:       (string)$body['nombre'],
        idCategoria:  (int)   $body['categoria_id'],
        cantidad:     (float) $body['cantidad'],
        precio:       (float) $body['precio_sugerido'],
        fechaCosecha: (string)$body['fecha'],
        descripcion:  $body['descripcion'] ?? null,
        foto:         $fotoNombre // Si es null, el modelo no debe sobreescribir la foto existente
    );

    $result['success']
        ? json_ok(['foto_nombre' => $fotoNombre], 200) // 200 OK
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
        : json_error('No se pudo actualizar el estado.', 422);
}
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
    // Con FormData, los datos llegan por POST nativo
    $body = $_POST; 
    
    Router::requireFields(['id_productor', 'nombre', 'categoria_id', 'cantidad', 'precio_sugerido', 'fecha'], $body);

    $fotoNombre = null;
    
    // Validar y procesar la imagen
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
        $fotoNombre = uniqid('lote_') . '.' . $ext; // Genera nombre único
        
        // Ajusta los '../' según dónde esté este archivo php respecto a la raíz de tu proyecto
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
        foto:         $fotoNombre, // Pasamos solo el nombre del archivo
        idProducto:   $body['id_producto'] ?? null
    );

    $result['success']
        ? json_ok(['id_lote' => $result['id_lote'], 'foto_nombre' => $fotoNombre], 201)
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

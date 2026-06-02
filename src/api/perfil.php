<?php
// Endpoint: /src/api/perfil.php
//
// GET  ?id_usuario=N&rol=comprador       → perfil comprador (stats + valoraciones)
// GET  ?id_usuario=N&rol=productor       → perfil productor (stats + valoraciones)
//
// PUT  {id_usuario, nombre,
//       telefono, id_zona, email?}       → actualiza datos editables del perfil
//
// POST {action:'valoracion',
//       id_entrega, id_evaluador,
//       id_evaluado, estrellas,
//       comentarios?}                    → registra calificación al finalizar entrega

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/PerfilDomain.php';

$domain = new PerfilDomain();

match (Router::method()) {
    'GET'  => handleGet($domain),
    'PUT'  => handlePut($domain),
    'POST' => handlePost($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(PerfilDomain $domain): void
{
    $idUsuario = Router::query('id_usuario');
    if ($idUsuario === null) {
        json_error('Se requiere id_usuario.', 422);
    }

    $rol = Router::query('rol', 'comprador');

    $perfil = match ($rol) {
        'productor' => $domain->getPerfilProductor((int) $idUsuario),
        default     => $domain->getPerfilComprador((int) $idUsuario),
    };

    $perfil === null
        ? json_error('Usuario no encontrado.', 404)
        : json_ok($perfil);
}

// ── PUT ───────────────────────────────────────────────────────────────────────

function handlePut(PerfilDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['id_usuario', 'nombre', 'telefono', 'id_zona'], $body);

    $ok = $domain->updatePerfil(
        idUsuario: (int) $body['id_usuario'],
        nombre:         trim($body['nombre']),
        telefono:       trim($body['telefono']),
        idZona:    (int) $body['id_zona']
    );

    $ok
        ? json_ok()
        : json_error('No se pudo actualizar el perfil.', 500);
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(PerfilDomain $domain): void
{
    $body   = Router::body();
    $action = $body['action'] ?? '';

    match ($action) {
        'valoracion' => registrarValoracion($domain, $body),
        default      => json_error('Acción no reconocida.', 400),
    };
}

function registrarValoracion(PerfilDomain $domain, array $body): void
{
    Router::requireFields(['id_entrega', 'id_evaluador', 'id_evaluado', 'estrellas'], $body);

    $result = $domain->registrarValoracion(
        idEntrega:   (int)  $body['id_entrega'],
        idEvaluador: (int)  $body['id_evaluador'],
        idEvaluado:  (int)  $body['id_evaluado'],
        estrellas:   (int)  $body['estrellas'],
        comentarios:        $body['comentarios'] ?? null
    );

    $result['success']
        ? json_ok(['id_valoracion' => $result['id_valoracion']], 201)
        : json_error($result['message'], 422);
}

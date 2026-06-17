<?php
// Endpoint: /src/api/usuarios.php
//
// GET  (sin params)                → todos los usuarios
// GET  ?nombre=x                   → filtrar por nombre o apellido (parcial)
// GET  ?correo=x                   → filtrar por email (parcial)
// GET  ?rol=productor|organizacion → filtrar por rol exacto
// GET  ?id=N                       → datos públicos de un usuario por ID
//
// Los filtros nombre, correo y rol son acumulables entre sí.

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/UsuarioDomain.php';

$domain = new UsuarioDomain();

match (Router::method()) {
    'GET'  => handleGet($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(UsuarioDomain $domain): void
{
    // ?id=N → datos públicos de un usuario específico
    $id = Router::query('id');
    if ($id !== null) {
        $usuario = $domain->getUsuario((int) $id);
        $usuario === null
            ? json_error('Usuario no encontrado.', 404)
            : json_ok($usuario);
    }

    // Sin id → listado con filtros opcionales (nombre, correo, rol)
    json_ok($domain->getUsuarios(
        nombre: Router::query('nombre'),
        correo: Router::query('correo'),
        rol:    Router::query('rol'),
    ));
}

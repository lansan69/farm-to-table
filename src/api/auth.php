<?php
// Endpoint: /src/api/auth.php
//
// GET  ?zonas=1                          → lista de zonas activas (para el form de registro)
// POST {action:'login',    ...}          → login por teléfono o email
// POST {action:'register', ...}          → registro de nuevo usuario

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/AuthDomain.php';

$domain = new AuthDomain();

match (Router::method()) {
    'GET'  => handleGet($domain),
    'POST' => handlePost($domain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(AuthDomain $domain): void
{
    // ?zonas=1 → zonas activas para el selector del form de registro
    if (Router::query('zonas')) {
        json_ok($domain->getZonasActivas());
    }

    json_error('Parámetro no reconocido.', 400);
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(AuthDomain $domain): void
{
    $body   = Router::body();
    $action = $body['action'] ?? '';

    match ($action) {
        'login'    => login($domain, $body),
        'register' => register($domain, $body),
        default    => json_error('Acción no reconocida.', 400),
    };
}

function login(AuthDomain $domain, array $body): void
{
    Router::requireFields(['identificador', 'contrasena'], $body);

    $usuario = $domain->login(
        trim($body['identificador']),
        $body['contrasena']
    );

    if ($usuario === null) {
        json_error('Credenciales incorrectas.', 401);
    }

    json_ok($usuario);
}

function register(AuthDomain $domain, array $body): void
{
    Router::requireFields(['id_zona', 'nombre', 'rol', 'telefono', 'contrasena'], $body);

    $result = $domain->register(
        idZona:    (int)    $body['id_zona'],
        nombre:             trim($body['nombre']),
        rol:                $body['rol'],
        telefono:           trim($body['telefono']),
        contrasena:         $body['contrasena'],
        email:    isset($body['email']) ? trim($body['email']) : null
    );

    $result['success']
        ? json_ok(['id_usuario' => $result['id_usuario']], 201)
        : json_error($result['message'], 422);
}

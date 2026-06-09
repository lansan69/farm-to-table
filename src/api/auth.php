<?php
// Endpoint: /src/api/auth.php
//
// GET  ?zonas=1                          → lista de zonas activas (para el form de registro)
// POST {action:'login',         ...}     → login por teléfono o email
// POST {action:'login_google',  ...}     → login / vinculación con Google ID token
// POST {action:'register',      ...}     → registro de nuevo usuario

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
        'login'           => login($domain, $body),
        'login_google'    => loginGoogle($domain, $body),
        'register'        => register($domain, $body),
        'register_google' => registerGoogle($domain, $body),
        default           => json_error('Acción no reconocida.', 400),
    };
}

function login(AuthDomain $domain, array $body): void
{
    Router::requireFields(['identificador', 'contrasena'], $body);

    $resultado = $domain->login(
        trim($body['identificador']),
        $body['contrasena']
    );

    match ($resultado) {
        'not_found'      => json_error('Usuario no encontrado.',  404),
        'wrong_password' => json_error('Contraseña incorrecta.',  401),
        default          => json_ok($resultado),
    };
}

function loginGoogle(AuthDomain $domain, array $body): void
{
    Router::requireFields(['id_token'], $body);

    $resultado = $domain->loginWithGoogle(trim($body['id_token']));

    match ($resultado) {
        'invalid_token'  => json_error('Token de Google inválido.',         401),
        'not_registered' => json_error('No hay cuenta vinculada a ese correo. Regístrate primero.', 404),
        default          => json_ok($resultado),
    };
}

function register(AuthDomain $domain, array $body): void
{
    Router::requireFields(['id_zona', 'nombre', 'rol', 'telefono', 'contrasena'], $body);

    $result = $domain->register(
        idZona:    (int) $body['id_zona'],
        nombre:         trim($body['nombre']),
        rol:            $body['rol'],
        telefono:       trim($body['telefono']),
        contrasena:     $body['contrasena'],
        email:    isset($body['email'])    ? trim($body['email'])    : null,
        apellido: isset($body['apellido']) ? trim($body['apellido']) : null
    );

    $result['success']
        ? json_ok(['id_usuario' => $result['id_usuario']], 201)
        : json_error($result['message'], 422);
}

function registerGoogle(AuthDomain $domain, array $body): void
{
    Router::requireFields(['id_token', 'id_zona', 'telefono', 'rol'], $body);

    $resultado = $domain->registerWithGoogle(
        idToken:  trim($body['id_token']),
        idZona:   (int) $body['id_zona'],
        telefono: trim($body['telefono']),
        rol:      $body['rol'],
        apellido: isset($body['apellido']) ? trim($body['apellido']) : ''
    );

    match ($resultado['code']) {
        'token'   => json_error($resultado['message'],   401),
        'phone'   => json_error($resultado['message'],   422),
        'email'   => json_error($resultado['message'],   423),

        default           => json_ok($resultado),
    };
}

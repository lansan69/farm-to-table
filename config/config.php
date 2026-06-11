<?php

// ─── Entorno ───────────────────────────────────────────────────────────────
define('ENV', getenv('APP_ENV') ?: 'development');
define('DEBUG', ENV === 'development');

// ─── Base de datos ─────────────────────────────────────────────────────────
define('DB_HOST', getenv('MYSQLHOST'));
define('DB_PORT', getenv('MYSQLPORT'));
define('DB_NAME', getenv('MYSQLDATABASE'));
define('DB_USER', getenv('MYSQLUSER'));
define('DB_PASS', getenv('MYSQLPASSWORD'));
define('DB_CHARSET', 'utf8mb4');

// ─── Aplicación ────────────────────────────────────────────────────────────
$defaultBaseUrl = getenv('RAILWAY_PUBLIC_DOMAIN') 
    ? 'https://' . getenv('RAILWAY_PUBLIC_DOMAIN') 
    : 'http://localhost/farm-to-table';

define('BASE_URL', getenv('BASE_URL') ?: $defaultBaseUrl);
define('APP_NAME', 'Farm to Table');

// Usando el nombre de tu captura de pantalla
define('GOOGLE_CLIENT_ID', getenv('ID_CLIENTE_GOOGLE'));
define('ABLY_API_KEY', getenv('ABLY_API_KEY'));

// ─── Errores (controlado por entorno) ──────────────────────────────────────
if (DEBUG) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}
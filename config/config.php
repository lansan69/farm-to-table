<?php

// ─── Entorno ───────────────────────────────────────────────────────────────
define('ENV', 'development');
define('DEBUG', ENV === 'development');

// ─── Base de datos ─────────────────────────────────────────────────────────
define('DB_HOST', 'kodama.proxy.rlwy.net');
define('DB_PORT', 31307);
define('DB_NAME', 'railway');
define('DB_USER', 'root');
define('DB_PASS', 'dPQpggvHVhjxfhpAsKapyfhPonDddLsb');
define('DB_CHARSET', 'utf8mb4');

// ─── Aplicación ────────────────────────────────────────────────────────────
define('BASE_URL', 'http://localhost/farm-to-table');
define('APP_NAME', 'Farm to Table');

// ─── Errores (controlado por entorno) ──────────────────────────────────────
if (DEBUG) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}
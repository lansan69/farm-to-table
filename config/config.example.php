<?php

// Copy this file to config.php and fill in your values.

// ─── Entorno ───────────────────────────────────────────────────────────────
define('ENV', 'development'); // 'development' | 'production'
define('DEBUG', ENV === 'development');

// ─── Base de datos ─────────────────────────────────────────────────────────
define('DB_HOST', 'localhost');         // Host del servidor MySQL
define('DB_PORT', 3306);               // Puerto por defecto de MySQL
define('DB_NAME', 'your_database');    // Nombre de la base de datos
define('DB_USER', 'your_user');        // Usuario de MySQL
define('DB_PASS', 'your_password');    // Contraseña (vacío en XAMPP por defecto)
define('DB_CHARSET', 'utf8mb4');

// ─── Aplicación ────────────────────────────────────────────────────────────
define('BASE_URL', 'http://localhost/farm-to-table'); // URL base del proyecto
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

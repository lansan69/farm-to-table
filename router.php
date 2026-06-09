<?php

// PHP built-in server router — replaces .htaccess for Railway deployment.
//
// Rules (in order):
//   1. /src/api/*.php  → execute the PHP file (API layer)
//   2. Real file exists in project root → serve it as-is (static assets, components)
//   3. Everything else → public/index.html (SPA fallback)

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// ── 1. API ────────────────────────────────────────────────────────────────────
if (preg_match('#^/src/api/([a-zA-Z0-9_\-]+\.php)$#', $uri, $m)) {
    $file = __DIR__ . '/src/api/' . $m[1];
    if (file_exists($file)) {
        require $file;
    } else {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Endpoint no encontrado.']);
    }
    return true;
}

// ── 2. Static files ───────────────────────────────────────────────────────────
// With no -t flag the document root is the project root, so return false serves
// /public/assets/... → project-root/public/assets/... correctly.
$file = __DIR__ . $uri;
if ($uri !== '/' && file_exists($file) && !is_dir($file)) {
    return false;
}

// ── 3. SPA fallback ───────────────────────────────────────────────────────────
require __DIR__ . '/public/index.html';
return true;

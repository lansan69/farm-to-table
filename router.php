<?php

// PHP built-in server router — replaces .htaccess for Railway deployment.
// Run with: php -S 0.0.0.0:$PORT -t public router.php
//
// Rules (in order):
//   1. /src/api/*.php  → execute the PHP file from the project root (outside public/)
//   2. Real file exists inside public/ → return false, let built-in server serve it
//   3. Everything else → public/index.html (SPA fallback)

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// ── 1. API ────────────────────────────────────────────────────────────────────
// __DIR__ is the project root (where router.php lives), one level above public/.
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

// ── 2. /public/* paths ────────────────────────────────────────────────────────
// app.js builds component URLs as /public/components/... (BASE_PATH = '').
// With -t public the doc root is public/, so return false can't resolve
// /public/public/... — serve these files manually from __DIR__/public/...
if (preg_match('#^/public/.#', $uri)) {
    $realPath = __DIR__ . $uri; // resolves to /project/public/components/...
    if (file_exists($realPath) && !is_dir($realPath)) {
        $ext = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
        $mimes = [
            'js'    => 'application/javascript; charset=utf-8',
            'mjs'   => 'application/javascript; charset=utf-8',
            'css'   => 'text/css; charset=utf-8',
            'html'  => 'text/html; charset=utf-8',
            'json'  => 'application/json; charset=utf-8',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'gif'   => 'image/gif',
            'svg'   => 'image/svg+xml',
            'ico'   => 'image/x-icon',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf'   => 'font/ttf',
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        readfile($realPath);
        return true;
    }
}

// ── 3. Static files ───────────────────────────────────────────────────────────
// With -t public, return false serves the file from public/ automatically.
// Check that the file actually exists there before delegating.
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri) && !is_dir(__DIR__ . '/public' . $uri)) {
    return false;
}

// ── 4. SPA fallback ───────────────────────────────────────────────────────────
require __DIR__ . '/public/index.html';
return true;

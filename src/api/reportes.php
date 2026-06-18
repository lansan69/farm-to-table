<?php
// Endpoint: /src/api/reportes.php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/UsuarioDomain.php'; // Cambiado a UsuarioDomain para unificar reportes

$userDomain = new UsuarioDomain();

match (Router::method()) {
    'GET'   => handleGet($userDomain),
    'POST'  => handlePost($userDomain),
    default => json_error('Método no permitido.', 405),
};

// ── GET ───────────────────────────────────────────────────────────────────────

function handleGet(UsuarioDomain $domain): void
{
    try {
        $reportes = $domain->obtenerHistorialReportes();
        json_ok($reportes, 200);

    } catch (Exception $e) {
        json_error('Error interno al recuperar el historial de reportes.', 500);
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────

function handlePost(UsuarioDomain $domain): void
{
    $body = $_POST; 
    Router::requireFields(['id_usuario_reporta', 'id_usuario_reportado', 'situacion'], $body);

    try {
        // Filtrar correctamente el chat_id para evitar que la palabra "null" o strings vacíos pasen como el número 0
        $chatId = null;
        if (isset($body['chat_id']) && $body['chat_id'] !== '' && $body['chat_id'] !== 'null' && $body['chat_id'] !== 'undefined') {
            $chatId = (int)$body['chat_id'];
        }

        $idReporte = $domain->reportarUsuario(
            id_reporta:   (int)    $body['id_usuario_reporta'],
            id_reportado: (int)    $body['id_usuario_reportado'],
            situacion:    (string) $body['situacion'],
            chat_id:      $chatId
        );

        if ($idReporte > 0) {
            json_ok(['id_reporte' => $idReporte], 201); 
        } else {
            json_error('No se pudo procesar el reporte en el servidor.', 500);
        }

    } catch (Exception $e) {
        // Exponemos el error real concatenando $e->getMessage()
        json_error('Error SQL/Server: ' . $e->getMessage(), 500);
    }
}
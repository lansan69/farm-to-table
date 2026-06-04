<?php

function json_ok(mixed $data = [], int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'ok', 'data' => $data]);
    exit;
}

function json_error(string $message, int $code = 400): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => $message]);
    exit;
}

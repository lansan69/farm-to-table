<?php

class Router
{
    /** Current HTTP method (GET, POST, PATCH, PUT, DELETE). */
    public static function method(): string
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    /** Parsed JSON body from the request. Returns empty array if body is absent or malformed. */
    public static function body(): array
    {
        static $cache = null;
        if ($cache === null) {
            $cache = json_decode(file_get_contents('php://input'), true) ?? [];
        }
        return $cache;
    }

    /** Returns a single query-string parameter, or $default if absent. */
    public static function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    /**
     * Asserts that all $keys are present and non-empty in $data.
     * Calls json_error(422) immediately if any key is missing.
     */
    public static function requireFields(array $keys, array $data): void
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $data) || $data[$key] === '' || $data[$key] === null) {
                json_error("Campo requerido ausente: {$key}", 422);
            }
        }
    }
}

<?php
// Endpoint: /src/api/config.php
//
// GET → returns public runtime configuration needed by the frontend.
//       Only non-secret, client-safe values are exposed here.

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';

json_ok([
    'google_client_id' => GOOGLE_CLIENT_ID,
]);

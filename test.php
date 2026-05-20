<?php

require_once __DIR__ . '/src/core/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query('SELECT NOW() AS server_time');
    $row  = $stmt->fetch();

    echo "✅ Conexión exitosa" . PHP_EOL;
    echo "🕐 Hora del servidor MySQL: " . $row['server_time'] . PHP_EOL;
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . PHP_EOL;
}


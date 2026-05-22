<?php

require_once __DIR__ . '/src/core/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query('SELECT \'usuarios\' as tabla, COUNT(*) as registros FROM usuarios
    UNION ALL
    SELECT \'catalogo_productos\', COUNT(*) FROM catalogo_productos
    UNION ALL
    SELECT \'lotes_excedentes\', COUNT(*) FROM lotes_excedentes;');
    $row  = $stmt->fetch();

    echo "✅ Conexión exitosa" . PHP_EOL;
    echo " 📊 Resumen de tablas:" . PHP_EOL;
    do {
        echo "   - " . $row['tabla'] . ": " . $row['registros'] . " registros" . PHP_EOL;
    } while ($row = $stmt->fetch());
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . PHP_EOL;
}


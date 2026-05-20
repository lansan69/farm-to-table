<?php
/**
 * Clase Database
 * 
 * Gestiona la conexión a la base de datos MySQL utilizando el patrón Singleton.
 * Garantiza una única instancia de conexión en toda la aplicación, mejorando
 * el rendimiento y la consistencia de las operaciones de base de datos.
 * 
 * @author Sistema Farm-to-Table
 * @version 1.0
 */

require_once __DIR__ . '/../../config/config.php';

class Database
{
    /**
     * @var ?Database Instancia única de la clase (Singleton)
     */
    private static ?Database $instance = null;

    /**
     * @var PDO Objeto de conexión a la base de datos
     */
    private PDO $connection;

    /**
     * Constructor privado (Patrón Singleton)
     * 
     * Inicializa la conexión PDO con la base de datos MySQL.
     * Define las opciones de conexión para manejo de errores, modo de consultas
     * y codificación de caracteres UTF-8.
     * 
     * Lanza una excepción PDOException si la conexión falla, mostrando
     * un mensaje de error detallado en DEBUG o genérico en producción.
     */
    private function __construct()
    {
        // Construye el DSN (Data Source Name) con parámetros de conexión
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        // Define opciones de PDO para configurar el comportamiento de la conexión
        $options = [
            // Lanza excepciones ante errores SQL
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            // Retorna resultados como arreglos asociativos
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Desactiva la emulación de sentencias preparadas (usa nativas)
            PDO::ATTR_EMULATE_PREPARES   => false, 
            // Establece la codificación de caracteres a UTF-8 Unicode
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ];

        try {
            // Crea la conexión PDO con credenciales desde las constantes de configuración
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Manejo de errores de conexión: no exponer detalles en producción
            $message = DEBUG
                ? 'Error de conexión: ' . $e->getMessage()
                : 'Error de conexión a la base de datos.';

            // Retorna respuesta HTTP 500 (Error Interno del Servidor)
            http_response_code(500);
            // Termina la ejecución con mensaje de error en formato JSON
            die(json_encode(['status' => 'error', 'message' => $message]));
        }
    }

    /**
     * Obtiene la instancia única de la clase (Patrón Singleton)
     * 
     * Si no existe una instancia previa, la crea y la almacena en la propiedad
     * estática. En sucesivas llamadas, retorna la misma instancia.
     * 
     * @return Database La instancia única de la clase
     */
    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }

        return self::$instance;
    }

    /**
     * Retorna el objeto de conexión PDO
     * 
     * Permite acceder directamente al objeto PDO para ejecutar consultas,
     * transacciones u otras operaciones avanzadas de base de datos.
     * 
     * @return PDO Objeto de conexión a la base de datos
     */
    public function getConnection(): PDO
    {
        return $this->connection;
    }

    /**
     * Previene la clonación de la instancia Singleton
     * 
     * Implementación privada del método mágico __clone para evitar
     * que se creen copias de la instancia única.
     */
    private function __clone() {}

    /**
     * Previene la deserialización de la instancia Singleton
     * 
     * Lanza una excepción cuando se intenta deserializar la instancia,
     * garantizando que siempre exista una única instancia en memoria.
     * 
     * @throws Exception Siempre lanza una excepción
     */
    public function __wakeup(): void
    {
        throw new \Exception('Cannot unserialize a Singleton.');
    }
}
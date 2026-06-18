<?php
require_once __DIR__ . '/../models/UsuarioModel.php';

class UsuarioDomain
{
    private UsuarioModel $usuarioModel;

    public function __construct()
    {
        $this->usuarioModel = new UsuarioModel();
    }

    /**
     * Lista todos los usuarios con filtros opcionales.
     * @param string|null $nombre  Búsqueda parcial en nombre_razon_social y apellido.
     * @param string|null $correo  Búsqueda parcial en email.
     * @param string|null $rol     Valor exacto: 'productor', 'organizacion' o 'admin'.
     */
    public function getUsuarios(
        ?string $nombre = null,
        ?string $correo = null,
        ?string $rol = null
    ): array {
        return $this->usuarioModel->findAll($nombre, $correo, $rol);
    }

    public function reportarUsuario(
        int $id_reporta,
        int $id_reportado,
        string $situacion,
        ?int $chat_id
    ): int {
        return $this->usuarioModel->reportarUsuario(
            $id_reporta,
            $id_reportado,
            $situacion,
            $chat_id
        );
    }

    public function obtenerHistorialReportes(): array
    {
        // Puedes agregar validaciones de rol aquí si solo el admin debería verlos
        return $this->usuarioModel->getReportes();
    }

    /**
     * Retorna los datos públicos de un usuario por ID (sin hash ni google_id).
     */
    public function getUsuario(int $idUsuario): ?array
    {
        $usuario = $this->usuarioModel->findByIdFromView($idUsuario);
        if ($usuario === null)
            return null;

        // Strip sensitive fields before returning
        unset($usuario['hash_contrasena'], $usuario['google_id']);
        return $usuario;
    }
}

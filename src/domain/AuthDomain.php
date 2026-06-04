<?php
require_once __DIR__ . '/../models/UsuarioModel.php';
require_once __DIR__ . '/../models/ZonaOperativaModel.php';

class AuthDomain
{
    private UsuarioModel $usuarioModel;
    private ZonaOperativaModel $zonaModel;

    public function __construct()
    {
        $this->usuarioModel = new UsuarioModel();
        $this->zonaModel    = new ZonaOperativaModel();
    }

    /**
     * Verifica credenciales por teléfono o email y devuelve los datos del usuario o null si fallan.
     */
    public function login(string $identificador, string $contrasena): ?array
    {
        $creds = filter_var($identificador, FILTER_VALIDATE_EMAIL)
            ? $this->usuarioModel->findByEmail($identificador)
            : $this->usuarioModel->findByTelefono($identificador);

        if ($creds === null) return null;
        if (!password_verify($contrasena, $creds['hash_contrasena'])) return null;

        return $this->usuarioModel->findById($creds['id_usuario']);
    }

    /**
     * Registra un nuevo usuario. Devuelve ['success' => bool, ...].
     */
    public function register(
        int     $idZona,
        string  $nombre,
        string  $rol,
        string  $telefono,
        string  $contrasena,
        ?string $email = null
    ): array {
        if (!in_array($rol, ['productor', 'organizacion', 'admin'], true)) {
            return ['success' => false, 'message' => 'Rol no válido.'];
        }

        if ($this->usuarioModel->existeTelefono($telefono)) {
            return ['success' => false, 'message' => 'El número de teléfono ya está registrado.'];
        }

        if ($email !== null && $this->usuarioModel->existeEmail($email)) {
            return ['success' => false, 'message' => 'El correo electrónico ya está registrado.'];
        }

        $hash = password_hash($contrasena, PASSWORD_BCRYPT);
        $id   = $this->usuarioModel->create($idZona, $nombre, $rol, $telefono, $hash, $email);

        return ['success' => true, 'id_usuario' => $id];
    }

    /**
     * Devuelve las zonas activas para el selector del formulario de registro.
     */
    public function getZonasActivas(): array
    {
        return $this->zonaModel->findAllActivas();
    }
}

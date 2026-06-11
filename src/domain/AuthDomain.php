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
    // Returns the user array on success, or 'not_found' / 'wrong_password' on failure.
    public function login(string $identificador, string $contrasena): array|string
    {
        $creds = filter_var($identificador, FILTER_VALIDATE_EMAIL)
            ? $this->usuarioModel->findByEmail($identificador)
            : $this->usuarioModel->findByTelefono($identificador);

        if ($creds === null) return 'not_found';

        // $2b$ (Python/OpenBSD bcrypt) is identical to $2y$ (PHP bcrypt);
        // this PHP build's password_verify doesn't accept the $2b$ prefix.
        $hash = str_replace('$2b$', '$2y$', $creds['hash_contrasena']);
        if (!password_verify($contrasena, $hash)) return 'wrong_password';

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
        ?string $email    = null,
        ?string $apellido = null
    ): array {
        if (!in_array($rol, ['usuario', 'productor', 'organizacion', 'admin'], true)) {
            return ['success' => false, 'message' => 'Rol no válido.'];
        }

        if ($this->usuarioModel->existeTelefono($telefono)) {
            return ['success' => false, 'message' => 'El número de teléfono ya está registrado.'];
        }

        if ($email !== null && $this->usuarioModel->existeEmail($email)) {
            return ['success' => false, 'message' => 'El correo electrónico ya está registrado.'];
        }

        $hash = password_hash($contrasena, PASSWORD_BCRYPT);
        $id   = $this->usuarioModel->create($idZona, $nombre, $rol, $telefono, $hash, $email, $apellido);

        return ['success' => true, 'id_usuario' => $id];
    }

    public function registerWithGoogle(
        string  $idToken,
        int     $idZona,
        string  $telefono,
        string  $rol,
        string  $apellido = ''
    ): array|string {
        $payload = $this->verifyGoogleToken($idToken);
        if (!$payload) return ['success' => false, 'message' => 'El token de google es inválido.', 'code' => 'token'];

        $googleId = $payload['sub'];
        $nombre   = $payload['given_name'] ?? ($payload['name'] ?? '');
        $email    = $payload['email'] ?? null;

        // Already registered by google_id → log them in
        $row = $this->usuarioModel->findByGoogleId($googleId);
        if ($row) {
            return $this->usuarioModel->findById($row['id_usuario']);
        }

        if ($email !== null && $this->usuarioModel->existeEmail($email)) {
            return ['success' => false, 'message' => 'El correo electrónico ya está registrado.', 'code' => 'email'];
        }

        if ($this->usuarioModel->existeTelefono($telefono)) {
            return ['success' => false, 'message' => 'El número de teléfono ya está registrado.', 'code' => 'phone'];
        }

        if (!in_array($rol, ['usuario', 'productor', 'organizacion', 'admin'], true)) {
            $rol = 'usuario';
        }

        $id = $this->usuarioModel->createWithGoogle(
            $idZona, $nombre, $apellido, $email, $telefono, $googleId, $rol
        );

        return $this->usuarioModel->findById($id);
    }

    /**
     * Verifica un ID token de Google y devuelve el usuario correspondiente.
     * Returns the user array, 'not_registered', or 'invalid_token'.
     */
    public function loginWithGoogle(string $idToken): array|string
    {
        $payload = $this->verifyGoogleToken($idToken);
        if (!$payload) return 'invalid_token';

        $googleId = $payload['sub'];
        $email    = $payload['email'] ?? null;

        // 1. Try lookup by google_id
        $row = $this->usuarioModel->findByGoogleId($googleId);

        // 2. Fallback: link by email if account exists
        if (!$row && $email) {
            $byEmail = $this->usuarioModel->findByEmail($email);
            if ($byEmail) {
                $this->usuarioModel->linkGoogleId($byEmail['id_usuario'], $googleId);
                $row = ['id_usuario' => $byEmail['id_usuario']];
            }
        }

        if (!$row) return 'not_registered';

        return $this->usuarioModel->findById($row['id_usuario']);
    }

    private function verifyGoogleToken(string $idToken): ?array
    {
        $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
        $ctx = stream_context_create(['http' => ['timeout' => 5]]);
        $response = @file_get_contents($url, false, $ctx);
        if (!$response) return null;

        $payload = json_decode($response, true);
        if (!$payload || isset($payload['error'])) return null;
        if (($payload['aud'] ?? '') !== GOOGLE_CLIENT_ID) return null;
        if (($payload['email_verified'] ?? '') !== 'true') return null;

        return $payload;
    }

    /**
     * Devuelve las zonas activas para el selector del formulario de registro.
     */
    public function getZonasActivas(): array
    {
        return $this->zonaModel->findAllActivas();
    }
}

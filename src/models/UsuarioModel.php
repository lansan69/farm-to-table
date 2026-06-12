<?php
require_once __DIR__ . '/BaseModel.php';

class UsuarioModel extends BaseModel
{
    public function findByTelefono(string $telefono): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id_usuario, rol_usuario, hash_contrasena FROM usuarios WHERE telefono_contacto = ?'
        );
        $stmt->execute([$telefono]);
        return $stmt->fetch() ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id_usuario, rol_usuario, hash_contrasena FROM usuarios WHERE email = ?'
        );
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT u.*, z.nombre_delegacion AS zona, z.codigo_postal
             FROM usuarios u
             LEFT JOIN zonas_operativas z ON z.id_zona = u.id_zona
             WHERE u.id_usuario = ?'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByIdFromView(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM v_usuarios_zona WHERE id_usuario = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function existeTelefono(string $telefono): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM usuarios WHERE telefono_contacto = ?');
        $stmt->execute([$telefono]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function existeEmail(string $email): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function create(
        int     $idZona,
        string  $nombre,
        string  $rol,
        string  $telefono,
        string  $hash,
        ?string $email    = null,
        ?string $apellido = null
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO usuarios (id_zona, nombre_razon_social, apellido, rol_usuario, telefono_contacto, hash_contrasena, email)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$idZona, $nombre, $apellido, $rol, $telefono, $hash, $email]);
        return (int) $this->db->lastInsertId();
    }

    public function createWithGoogle(
        int     $idZona,
        string  $nombre,
        string  $apellido,
        ?string $email,
        string  $telefono,
        string  $googleId,
        string  $rol
    ): int {
        $hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
        $stmt = $this->db->prepare(
            'INSERT INTO usuarios (id_zona, nombre_razon_social, apellido, rol_usuario, telefono_contacto, hash_contrasena, email, google_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$idZona, $nombre, $apellido, $rol, $telefono, $hash, $email ?: null, $googleId]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $nombre, ?string $apellido, string $telefono, int $idZona, ?string $email = null): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE usuarios SET nombre_razon_social = ?, apellido = ?, telefono_contacto = ?, id_zona = ?, email = ? WHERE id_usuario = ?'
        );
        return $stmt->execute([$nombre, $apellido, $telefono, $idZona, $email, $id]);
    }

    public function updatePassword(int $id, string $hash): bool
    {
        $stmt = $this->db->prepare('UPDATE usuarios SET hash_contrasena = ? WHERE id_usuario = ?');
        return $stmt->execute([$hash, $id]);
    }

    public function findByGoogleId(string $googleId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id_usuario FROM usuarios WHERE google_id = ?'
        );
        $stmt->execute([$googleId]);
        return $stmt->fetch() ?: null;
    }

    public function linkGoogleId(int $userId, string $googleId): void
    {
        $stmt = $this->db->prepare('UPDATE usuarios SET google_id = ? WHERE id_usuario = ?');
        $stmt->execute([$googleId, $userId]);
    }

    public function getStatsComprador(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT u.id_usuario,
                    u.puntuacion_promedio,
                    COUNT(DISTINCT nc.id_negociacion)                                                                   AS total_negociaciones,
                    COUNT(DISTINCT CASE WHEN nc.estado_negociacion = "aceptada" THEN nc.id_negociacion END)             AS negociaciones_aceptadas,
                    COUNT(DISTINCT CASE WHEN nc.estado_negociacion = "pendiente" THEN nc.id_negociacion END)            AS negociaciones_pendientes
             FROM usuarios u
             LEFT JOIN negociaciones_contraoferta nc ON nc.id_comprador = u.id_usuario
             WHERE u.id_usuario = ?
             GROUP BY u.id_usuario'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getStatsProductor(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT u.id_usuario,
                    u.puntuacion_promedio,
                    COUNT(DISTINCT le.id_lote)                                                                          AS total_lotes,
                    COUNT(DISTINCT CASE WHEN le.estado_lote = "disponible"    THEN le.id_lote END)                     AS lotes_disponibles,
                    COUNT(DISTINCT CASE WHEN le.estado_lote = "en_negociacion" THEN le.id_lote END)                    AS lotes_en_negociacion,
                    COUNT(DISTINCT CASE WHEN le.estado_lote = "asignado"      THEN le.id_lote END)                     AS lotes_asignados
             FROM usuarios u
             LEFT JOIN lotes_excedentes le ON le.id_productor = u.id_usuario
             WHERE u.id_usuario = ?
             GROUP BY u.id_usuario'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}

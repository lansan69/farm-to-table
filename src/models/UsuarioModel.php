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

    public function reportarUsuario(
        int $id_reporta,
        int $id_reportado,
        string $situacion,
        ?int $chat_id
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO reportes (id_usuario_reporta, id_usuario_reportado, situacion, chat_id)
         VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$id_reporta, $id_reportado, $situacion, $chat_id]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Obtiene el historial de reportes con nombres legibles de los usuarios involucrados.
     */
    public function getReportes(): array
    {
        $sql = 'SELECT r.id, 
                       r.id_usuario_reporta, 
                       r.id_usuario_reportado, 
                       r.situacion, 
                       r.fecha_reporte, 
                       r.chat_id,
                       CONCAT(u_rep.nombre_razon_social, " ", COALESCE(u_rep.apellido, "")) AS nombre_reporta,
                       CONCAT(u_to.nombre_razon_social, " ", COALESCE(u_to.apellido, ""))  AS nombre_reportado
                FROM reportes r
                LEFT JOIN usuarios u_rep ON u_rep.id_usuario = r.id_usuario_reporta
                LEFT JOIN usuarios u_to  ON u_to.id_usuario  = r.id_usuario_reportado
                ORDER BY r.fecha_reporte DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create(
        int $idZona,
        string $nombre,
        string $rol,
        string $telefono,
        string $hash,
        ?string $email = null,
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
        int $idZona,
        string $nombre,
        string $apellido,
        ?string $email,
        string $telefono,
        string $googleId,
        string $rol
    ): int {
        $hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
        $stmt = $this->db->prepare(
            'INSERT INTO usuarios (id_zona, nombre_razon_social, apellido, rol_usuario, telefono_contacto, hash_contrasena, email, google_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$idZona, $nombre, $apellido, $rol, $telefono, $hash, $email ?: null, $googleId]);
        return (int) $this->db->lastInsertId();
    }

public function update(
        int $id, 
        string $nombre, 
        ?string $apellido, 
        string $telefono, 
        int $idZona, 
        ?string $email = null,
        ?string $foto_perfil = null
    ): bool {
        // Construimos la consulta base
        $sql = 'UPDATE usuarios SET nombre_razon_social = ?, apellido = ?, telefono_contacto = ?, id_zona = ?, email = ?';
        $params = [$nombre, $apellido, $telefono, $idZona, $email];

        // Si se envió una foto nueva, la agregamos al UPDATE
        if ($foto_perfil !== null) {
            $sql .= ', foto = ?';
            $params[] = $foto_perfil;
        }

        // Cerramos la consulta con el WHERE
        $sql .= ' WHERE id_usuario = ?';
        $params[] = $id;

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
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

    /**
     * Lista todos los usuarios con filtros opcionales por nombre, correo y rol.
     * Nunca expone hash_contrasena ni google_id.
     */
    public function findAll(?string $nombre = null, ?string $correo = null, ?string $rol = null): array
    {
        $where = [];
        $params = [];

        if ($nombre !== null && $nombre !== '') {
            $where[] = '(u.nombre_razon_social LIKE ? OR u.apellido LIKE ?)';
            $term = '%' . $nombre . '%';
            $params[] = $term;
            $params[] = $term;
        }

        if ($correo !== null && $correo !== '') {
            $where[] = 'u.email LIKE ?';
            $params[] = '%' . $correo . '%';
        }

        if ($rol !== null && $rol !== '') {
            $where[] = 'u.rol_usuario = ?';
            $params[] = $rol;
        }

        $sql = 'SELECT u.id_usuario,
                       u.nombre_razon_social,
                       u.apellido,
                       u.rol_usuario,
                       u.telefono_contacto,
                       u.email,
                       u.fecha_registro,
                       u.puntuacion_promedio,
                       z.id_zona,
                       z.nombre_delegacion,
                       z.codigo_postal
                FROM usuarios u
                LEFT JOIN zonas_operativas z ON z.id_zona = u.id_zona'
            . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
            . ' ORDER BY u.fecha_registro DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getStatsComprador(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT u.id_usuario,
                    u.puntuacion_promedio,
                    u.foto,
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
                    u.foto,
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

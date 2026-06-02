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
        $stmt = $this->db->prepare('SELECT * FROM vw_usuarios_ubicacion WHERE id_usuario = ?');
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
        ?string $email = null
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO usuarios (id_zona, nombre_razon_social, rol_usuario, telefono_contacto, hash_contrasena, email)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$idZona, $nombre, $rol, $telefono, $hash, $email]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $nombre, string $telefono, int $idZona, ?string $email = null): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE usuarios SET nombre_razon_social = ?, telefono_contacto = ?, id_zona = ?, email = ? WHERE id_usuario = ?'
        );
        return $stmt->execute([$nombre, $telefono, $idZona, $email, $id]);
    }

    public function getStatsComprador(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM vw_stats_comprador WHERE id_usuario = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getStatsProductor(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM vw_stats_productor WHERE id_usuario = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}

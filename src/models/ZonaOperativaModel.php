<?php
require_once __DIR__ . '/BaseModel.php';

class ZonaOperativaModel extends BaseModel
{
    public function findAllActivas(): array
    {
        $stmt = $this->db->query(
            'SELECT id_zona, nombre_delegacion, codigo_postal
             FROM zonas_operativas
             WHERE activa = TRUE
             ORDER BY nombre_delegacion'
        );
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM zonas_operativas WHERE id_zona = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id_zona, nombre_delegacion, codigo_postal, activa
             FROM zonas_operativas
             ORDER BY nombre_delegacion'
        );
        return $stmt->fetchAll();
    }

    public function create(string $nombre, string $codigoPostal): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO zonas_operativas (nombre_delegacion, codigo_postal) VALUES (?, ?)'
        );
        $stmt->execute([$nombre, $codigoPostal]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $nombre, string $codigoPostal): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE zonas_operativas SET nombre_delegacion = ?, codigo_postal = ? WHERE id_zona = ?'
        );
        return $stmt->execute([$nombre, $codigoPostal, $id]);
    }

    public function toggleActiva(int $id): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE zonas_operativas SET activa = NOT activa WHERE id_zona = ?'
        );
        return $stmt->execute([$id]);
    }
}

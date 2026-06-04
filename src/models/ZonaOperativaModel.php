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
}

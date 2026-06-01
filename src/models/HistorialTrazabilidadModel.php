<?php
require_once __DIR__ . '/BaseModel.php';

class HistorialTrazabilidadModel extends BaseModel
{
    public function findByLote(int $idLote): array
    {
        $stmt = $this->db->prepare(
            'SELECT ht.id_trazabilidad, ht.evento_descripcion, ht.fecha_evento,
                    u.nombre_razon_social AS responsable
             FROM historial_trazabilidad ht
             JOIN usuarios u ON ht.id_usuario_responsable = u.id_usuario
             WHERE ht.id_lote = ?
             ORDER BY ht.fecha_evento ASC'
        );
        $stmt->execute([$idLote]);
        return $stmt->fetchAll();
    }

    public function create(int $idLote, int $idUsuario, string $descripcion): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO historial_trazabilidad (id_lote, id_usuario_responsable, evento_descripcion)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([$idLote, $idUsuario, $descripcion]);
        return (int) $this->db->lastInsertId();
    }
}

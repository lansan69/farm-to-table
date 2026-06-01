<?php
require_once __DIR__ . '/BaseModel.php';

class DetalleOfertaModel extends BaseModel
{
    public function findByNegociacion(int $idNegociacion): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_detalle, id_usuario_emisor, monto_propuesto, comentario, fecha_envio
             FROM detalles_ofertas
             WHERE id_negociacion = ?
             ORDER BY fecha_envio ASC'
        );
        $stmt->execute([$idNegociacion]);
        return $stmt->fetchAll();
    }

    public function create(
        int     $idNegociacion,
        int     $idEmisor,
        float   $monto,
        ?string $comentario
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO detalles_ofertas (id_negociacion, id_usuario_emisor, monto_propuesto, comentario)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$idNegociacion, $idEmisor, $monto, $comentario]);
        return (int) $this->db->lastInsertId();
    }
}

<?php
require_once __DIR__ . '/BaseModel.php';

class EntregaLogisticaModel extends BaseModel
{
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM entregas_logistica WHERE id_entrega = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByNegociacion(int $idNegociacion): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM entregas_logistica WHERE id_negociacion = ?'
        );
        $stmt->execute([$idNegociacion]);
        return $stmt->fetch() ?: null;
    }

    public function findByCodigoQR(string $codigo): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM entregas_logistica WHERE codigo_verificacion_qr = ?'
        );
        $stmt->execute([$codigo]);
        return $stmt->fetch() ?: null;
    }

    public function create(
        int    $idNegociacion,
        string $estado,
        string $fechaEstimada,
        string $codigoQR
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO entregas_logistica
                (id_negociacion, estado_entrega, fecha_estimada_entrega, codigo_verificacion_qr)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$idNegociacion, $estado, $fechaEstimada, $codigoQR]);
        return (int) $this->db->lastInsertId();
    }

    public function updateEstado(int $id, string $estado): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE entregas_logistica SET estado_entrega = ? WHERE id_entrega = ?'
        );
        return $stmt->execute([$estado, $id]);
    }

    public function registrarRecepcion(int $id): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE entregas_logistica
             SET estado_entrega = ?, fecha_recepcion_real = NOW()
             WHERE id_entrega = ?'
        );
        return $stmt->execute(['entregado', $id]);
    }
}

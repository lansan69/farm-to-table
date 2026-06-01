<?php
require_once __DIR__ . '/BaseModel.php';

class ValoracionReputacionModel extends BaseModel
{
    public function findByEvaluado(int $idEvaluado): array
    {
        $stmt = $this->db->prepare(
            'SELECT vr.calificacion_estrellas, vr.comentarios, vr.fecha_valoracion,
                    u.nombre_razon_social  AS evaluador,
                    cp.nombre_producto,
                    e.fecha_recepcion_real AS fecha_entrega
             FROM valoraciones_reputacion vr
             JOIN usuarios u                   ON vr.id_usuario_evaluador = u.id_usuario
             JOIN entregas_logistica e          ON vr.id_entrega           = e.id_entrega
             JOIN negociaciones_contraoferta n  ON e.id_negociacion        = n.id_negociacion
             JOIN lotes_excedentes le           ON n.id_lote               = le.id_lote
             JOIN catalogo_productos cp         ON le.id_producto          = cp.id_producto
             WHERE vr.id_usuario_evaluado = ?
             ORDER BY vr.fecha_valoracion DESC'
        );
        $stmt->execute([$idEvaluado]);
        return $stmt->fetchAll();
    }

    public function getPromedio(int $idUsuario): array
    {
        $stmt = $this->db->prepare(
            'SELECT AVG(calificacion_estrellas) AS promedio, COUNT(*) AS total_valoraciones
             FROM valoraciones_reputacion
             WHERE id_usuario_evaluado = ?'
        );
        $stmt->execute([$idUsuario]);
        return $stmt->fetch();
    }

    public function create(
        int     $idEntrega,
        int     $idEvaluador,
        int     $idEvaluado,
        int     $estrellas,
        ?string $comentarios
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO valoraciones_reputacion
                (id_entrega, id_usuario_evaluador, id_usuario_evaluado, calificacion_estrellas, comentarios)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$idEntrega, $idEvaluador, $idEvaluado, $estrellas, $comentarios]);
        return (int) $this->db->lastInsertId();
    }
}

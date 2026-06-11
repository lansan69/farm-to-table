<?php
require_once __DIR__ . '/BaseModel.php';

class NegociacionModel extends BaseModel
{
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM negociaciones_contraoferta WHERE id_negociacion = ?'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByComprador(int $idComprador): array
    {
        $stmt = $this->db->prepare(
            'SELECT v.*, z.nombre_delegacion AS zona,
                    d.comentario AS ultimo_comentario
             FROM v_negociaciones_detalle v
             JOIN usuarios u ON u.id_usuario = v.id_vendedor
             LEFT JOIN zonas_operativas z ON z.id_zona = u.id_zona
             LEFT JOIN detalles_ofertas d ON d.id_detalle = (
                 SELECT id_detalle FROM detalles_ofertas
                 WHERE id_negociacion = v.id_negociacion
                 ORDER BY fecha_envio DESC
                 LIMIT 1
             )
             WHERE v.id_comprador = ?'
        );
        $stmt->execute([$idComprador]);
        return $stmt->fetchAll();
    }

    public function findByProductor(int $idProductor): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM v_negociaciones_detalle WHERE id_vendedor = ?'
        );
        $stmt->execute([$idProductor]);
        return $stmt->fetchAll();
    }

    public function create(int $idLote, int $idComprador): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO negociaciones_contraoferta (id_lote, id_comprador, estado_negociacion)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([$idLote, $idComprador, 'pendiente']);
        return (int) $this->db->lastInsertId();
    }

    public function updateEstado(int $id, string $estado): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE negociaciones_contraoferta SET estado_negociacion = ? WHERE id_negociacion = ?'
        );
        return $stmt->execute([$estado, $id]);
    }

    public function findHistorialComprador(int $idComprador): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_negociacion, nombre_producto, cantidad_kg, ultima_oferta,
                    nombre_vendedor, estado_negociacion, fecha_creacion
             FROM v_negociaciones_detalle
             WHERE id_comprador = ?
             ORDER BY fecha_creacion DESC'
        );
        $stmt->execute([$idComprador]);
        return $stmt->fetchAll();
    }

    public function findHistorialProductor(int $idProductor): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_negociacion, nombre_producto, cantidad_kg, ultima_oferta,
                    nombre_comprador, estado_negociacion, fecha_creacion
             FROM v_negociaciones_detalle
             WHERE id_vendedor = ?
             ORDER BY fecha_creacion DESC'
        );
        $stmt->execute([$idProductor]);
        return $stmt->fetchAll();
    }
}

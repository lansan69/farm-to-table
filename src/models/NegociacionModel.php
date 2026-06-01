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

    /** Vista contraofertas_cliente — filtra por el comprador */
    public function findByComprador(int $idComprador): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM contraofertas_cliente WHERE id_comprador = ?'
        );
        $stmt->execute([$idComprador]);
        return $stmt->fetchAll();
    }

    /** Vista contraofertas_productor — filtra por el productor dueño del lote */
    public function findByProductor(int $idProductor): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM contraofertas_productor WHERE id_productor = ?'
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

    /** Historial completo de compras de un comprador (vista vw_info_compra_venta) */
    public function findHistorialComprador(int $idComprador): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_negociacion, nombre_producto, cantidad_kg, precio_ultima_oferta,
                    nombre_productor, estado_negociacion, estado_entrega,
                    fecha_inicio_negociacion, fecha_recepcion_real
             FROM vw_info_compra_venta
             WHERE id_comprador = ?
             ORDER BY fecha_inicio_negociacion DESC'
        );
        $stmt->execute([$idComprador]);
        return $stmt->fetchAll();
    }

    /** Historial completo de ventas de un productor (vista vw_info_compra_venta) */
    public function findHistorialProductor(int $idProductor): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_negociacion, nombre_producto, cantidad_kg, precio_ultima_oferta,
                    nombre_comprador, estado_negociacion, estado_entrega,
                    fecha_inicio_negociacion, fecha_recepcion_real
             FROM vw_info_compra_venta
             WHERE id_productor = ?
             ORDER BY fecha_inicio_negociacion DESC'
        );
        $stmt->execute([$idProductor]);
        return $stmt->fetchAll();
    }
}

<?php
require_once __DIR__ . '/BaseModel.php';

/**
 * Requiere la tabla favoritos_marketplace definida en querys/Juan/marketplace-productos-favoritos.sql
 */
class FavoritoModel extends BaseModel
{
    public function findByUsuario(int $idUsuario): array
    {
        $stmt = $this->db->prepare(
            'SELECT fm.id_favorito, fm.id_lote, fm.fecha_agregado,
                    cp.nombre_producto, cat.nombre_categoria,
                    le.cantidad_kg, le.precio_recuperacion_sugerido, le.estado_lote,
                    u.nombre_razon_social AS nombre_productor
             FROM favoritos_marketplace fm
             JOIN lotes_excedentes le      ON fm.id_lote      = le.id_lote
             JOIN catalogo_productos cp    ON le.id_producto  = cp.id_producto
             JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
             JOIN usuarios u               ON le.id_productor = u.id_usuario
             WHERE fm.id_usuario = ?
             ORDER BY fm.fecha_agregado DESC'
        );
        $stmt->execute([$idUsuario]);
        return $stmt->fetchAll();
    }

    public function existe(int $idUsuario, int $idLote): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM favoritos_marketplace WHERE id_usuario = ? AND id_lote = ?'
        );
        $stmt->execute([$idUsuario, $idLote]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function agregar(int $idUsuario, int $idLote): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO favoritos_marketplace (id_usuario, id_lote) VALUES (?, ?)'
        );
        $stmt->execute([$idUsuario, $idLote]);
        return (int) $this->db->lastInsertId();
    }

    public function eliminar(int $idUsuario, int $idLote): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM favoritos_marketplace WHERE id_usuario = ? AND id_lote = ?'
        );
        return $stmt->execute([$idUsuario, $idLote]);
    }
}

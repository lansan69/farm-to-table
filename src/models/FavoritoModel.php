<?php
require_once __DIR__ . '/BaseModel.php';

class FavoritoModel extends BaseModel
{
    /**
     * All favorited lots for a user, enriched with product/vendor info from v_lotes_card.
     */
    public function findByUsuario(int $idUsuario): array
    {
        $stmt = $this->db->prepare(
            'SELECT f.id_lote, f.created_at,
                    v.nombre_producto, v.nombre_categoria, v.nombre_productor,
                    v.cantidad_kg, v.precio_recuperacion_sugerido, v.estado_lote,
                    v.calificacion_producto, v.id_categoria, v.zona
             FROM favoritos f
             JOIN v_lotes_card v ON v.id_lote = f.id_lote
             WHERE f.id_usuario = ?
             ORDER BY f.created_at DESC'
        );
        $stmt->execute([$idUsuario]);
        return $stmt->fetchAll();
    }

    public function existe(int $idUsuario, int $idLote): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM favoritos WHERE id_usuario = ? AND id_lote = ?'
        );
        $stmt->execute([$idUsuario, $idLote]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function agregar(int $idUsuario, int $idLote): void
    {
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO favoritos (id_usuario, id_lote) VALUES (?, ?)'
        );
        $stmt->execute([$idUsuario, $idLote]);
    }

    public function eliminar(int $idUsuario, int $idLote): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM favoritos WHERE id_usuario = ? AND id_lote = ?'
        );
        return $stmt->execute([$idUsuario, $idLote]);
    }
}

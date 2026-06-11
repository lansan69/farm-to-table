<?php
require_once __DIR__ . '/BaseModel.php';

class LoteExcedenteModel extends BaseModel
{
    public function findAllDisponibles(): array
    {
        return $this->db
            ->query('SELECT * FROM v_lotes_disponibles ORDER BY fecha_publicacion DESC')
            ->fetchAll();
    }

    /**
     * Filtered search over v_lotes_disponibles.
     * Pass null for any parameter that should not be applied.
     */
    public function buscar(?string $nombre, ?int $idCategoria): array
    {
        $like = $nombre !== null ? '%' . $nombre . '%' : null;
        $stmt = $this->db->prepare(
            'SELECT * FROM v_lotes_disponibles
             WHERE (? IS NULL OR nombre_producto LIKE ?)
               AND (? IS NULL OR id_categoria   =  ?)
             ORDER BY fecha_publicacion DESC'
        );
        $stmt->execute([$nombre, $like, $idCategoria, $idCategoria]);
        return $stmt->fetchAll();
    }

    /**
     * Full detail for a single lot regardless of status — backed by v_lotes_card.
     */
    public function findByIdDetalle(int $idLote): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM v_lotes_card WHERE id_lote = ?');
        $stmt->execute([$idLote]);
        return $stmt->fetch() ?: null;
    }

    /**
     * All lots for a given producer with resolved product/category names.
     */
    public function findByProductor(int $idProductor): array
    {
        $stmt = $this->db->prepare(
            'SELECT le.*,
                    COALESCE(cp.nombre_producto,      le.nombre_producto)      AS nombre_producto_display,
                    COALESCE(cat_cp.nombre_categoria, cat_le.nombre_categoria) AS nombre_categoria
             FROM lotes_excedentes le
             LEFT JOIN catalogo_productos   cp     ON cp.id_producto    = le.id_producto
             LEFT JOIN categorias_productos cat_cp ON cat_cp.id_categoria = cp.id_categoria
             LEFT JOIN categorias_productos cat_le ON cat_le.id_categoria = le.id_categoria
             WHERE le.id_productor = ?
             ORDER BY le.fecha_publicacion DESC'
        );
        $stmt->execute([$idProductor]);
        return $stmt->fetchAll();
    }

    /**
     * Available lots expiring within the next 3 days.
     * dias_restantes is computed as days between today and (fecha_cosecha + vida_util_dias).
     */
    public function findUrgentes(): array
    {
        return $this->db
            ->query(
                'SELECT *,
                        DATEDIFF(DATE_ADD(fecha_cosecha, INTERVAL vida_util_dias DAY), CURDATE()) AS dias_restantes
                 FROM v_lotes_disponibles
                 WHERE DATEDIFF(DATE_ADD(fecha_cosecha, INTERVAL vida_util_dias DAY), CURDATE()) BETWEEN 0 AND 3
                 ORDER BY dias_restantes ASC'
            )
            ->fetchAll();
    }

    public function create(
        int    $idProductor,
        int    $idProducto,
        float  $cantidad,
        string $fechaCosecha,
        float  $precio
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO lotes_excedentes
                (id_productor, id_producto, cantidad_kg, fecha_cosecha, precio_recuperacion_sugerido)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$idProductor, $idProducto, $cantidad, $fechaCosecha, $precio]);
        return (int) $this->db->lastInsertId();
    }

    public function updateEstado(int $idLote, int $idProductor, string $estado): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE lotes_excedentes
             SET estado_lote = ?
             WHERE id_lote = ? AND id_productor = ?'
        );
        return $stmt->execute([$estado, $idLote, $idProductor]);
    }
}

<?php
require_once __DIR__ . '/BaseModel.php';

class LoteExcedenteModel extends BaseModel
{
    public function findAllDisponibles(): array
    {
        return $this->db
            ->query('SELECT * FROM vw_lotes_navegador ORDER BY fecha_publicacion DESC')
            ->fetchAll();
    }

    /**
     * Búsqueda combinada. Pasa null en los parámetros que no apliquen.
     * Internamente consulta vw_lotes_navegador usando el patrón (? IS NULL OR ...).
     */
    public function buscar(?string $nombre, ?int $idCategoria, ?int $idZona): array
    {
        $like = $nombre !== null ? '%' . $nombre . '%' : null;
        $stmt = $this->db->prepare(
            'SELECT * FROM vw_lotes_navegador
             WHERE (? IS NULL OR nombre_producto LIKE ?)
               AND (? IS NULL OR id_categoria   =  ?)
               AND (? IS NULL OR id_zona        =  ?)
             ORDER BY fecha_publicacion DESC'
        );
        $stmt->execute([$nombre, $like, $idCategoria, $idCategoria, $idZona, $idZona]);
        return $stmt->fetchAll();
    }

    /**
     * Devuelve una fila por foto (LEFT JOIN). Si el lote no tiene fotos devuelve
     * una sola fila con id_foto = null. El Domain se encarga de aplanar el resultado.
     */
    public function findByIdDetalle(int $idLote): array
    {
        $stmt = $this->db->prepare('SELECT * FROM vw_detalle_lote WHERE id_lote = ?');
        $stmt->execute([$idLote]);
        return $stmt->fetchAll();
    }

    public function findByProductor(int $idProductor): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM vw_lotes_productor
             WHERE id_productor = ?
             ORDER BY fecha_publicacion DESC'
        );
        $stmt->execute([$idProductor]);
        return $stmt->fetchAll();
    }

    public function findUrgentes(): array
    {
        return $this->db
            ->query(
                'SELECT * FROM vw_lotes_navegador
                 WHERE dias_restantes_vida_util BETWEEN 0 AND 3
                 ORDER BY dias_restantes_vida_util ASC'
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

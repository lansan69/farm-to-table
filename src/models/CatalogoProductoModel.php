<?php
require_once __DIR__ . '/BaseModel.php';

class CatalogoProductoModel extends BaseModel
{
    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT cp.id_producto, cp.nombre_producto, cp.vida_util_promedio_dias,
                    cat.id_categoria, cat.nombre_categoria
             FROM catalogo_productos cp
             JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
             ORDER BY cat.nombre_categoria, cp.nombre_producto'
        );
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT cp.*, cat.nombre_categoria
             FROM catalogo_productos cp
             JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
             WHERE cp.id_producto = ?'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByNombre(string $nombre): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_producto, nombre_producto, vida_util_promedio_dias, id_categoria
             FROM catalogo_productos
             WHERE nombre_producto LIKE ?
             ORDER BY nombre_producto'
        );
        $stmt->execute(['%' . $nombre . '%']);
        return $stmt->fetchAll();
    }
}

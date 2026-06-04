<?php
require_once __DIR__ . '/BaseModel.php';

class CategoriaProductoModel extends BaseModel
{
    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id_categoria, nombre_categoria, descripcion
             FROM categorias_productos
             ORDER BY nombre_categoria'
        );
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM categorias_productos WHERE id_categoria = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}

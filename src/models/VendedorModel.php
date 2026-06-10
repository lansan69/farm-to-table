<?php
require_once __DIR__ . '/BaseModel.php';

class VendedorModel extends BaseModel
{
    public function findAll(): array
    {
        return $this->db
            ->query('SELECT * FROM v_vendedores ORDER BY nombre_razon_social')
            ->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM v_vendedores WHERE id_usuario = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}

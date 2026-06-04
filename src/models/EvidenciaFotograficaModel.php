<?php
require_once __DIR__ . '/BaseModel.php';

class EvidenciaFotograficaModel extends BaseModel
{
    public function findByLote(int $idLote): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_foto, url_archivo, fecha_subida
             FROM evidencias_fotograficas
             WHERE id_lote = ?
             ORDER BY fecha_subida ASC'
        );
        $stmt->execute([$idLote]);
        return $stmt->fetchAll();
    }

    public function create(int $idLote, string $urlArchivo): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO evidencias_fotograficas (id_lote, url_archivo) VALUES (?, ?)'
        );
        $stmt->execute([$idLote, $urlArchivo]);
        return (int) $this->db->lastInsertId();
    }

    public function delete(int $idFoto): bool
    {
        $stmt = $this->db->prepare('DELETE FROM evidencias_fotograficas WHERE id_foto = ?');
        return $stmt->execute([$idFoto]);
    }
}

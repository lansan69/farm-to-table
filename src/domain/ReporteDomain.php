<?php
require_once __DIR__ . '/../models/ReporteModel.php';

class ReporteDomain
{
    private ReporteModel $reporteModel;

    public function __construct()
    {
        $this->reporteModel = new ReporteModel();
    }

    public function getReportes(
        ?string $search_term = null,
        ?int $id_reporta = null,
        ?int $id_reportado = null,
        ?string $fecha = null
    ): array {
        return $this->reporteModel->findAll(
            searchTerm: $search_term,
            id_reporta: $id_reporta,
            id_reportado: $id_reportado,
            fecha: $fecha
        );
    }

    public function findByIdReporta(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM reportes WHERE id_usuario_reporta = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByIdReportado(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM reportes WHERE id_usuario_reportado = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}

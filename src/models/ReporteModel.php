<?php
require_once __DIR__ . '/BaseModel.php';
class ReporteModel extends BaseModel
{
    public function findAll(?string $searchTerm = null, ?int $id_reporta = null, ?int $id_reportado = null, ?string $fecha = null): array
    {
        // Consulta base
        $sql = 'SELECT * FROM vista_detalles_reportes';
        $whereConditions = [];
        $params = [];

        // Filtro de búsqueda por término (nombre completo o email de ambos usuarios)
        if ($searchTerm !== null && trim($searchTerm) !== '') {
            $whereConditions[] = '(
                usuario_reporta_nombre LIKE :search1 OR 
                usuario_reporta_email LIKE :search2 OR 
                usuario_reportado_nombre LIKE :search3 OR 
                usuario_reportado_email LIKE :search4 OR
                situacion LIKE :search5
            )';
            
            $term = '%' . $searchTerm . '%';
            $params[':search1'] = $term;
            $params[':search2'] = $term;
            $params[':search3'] = $term;
            $params[':search4'] = $term;
            $params[':search5'] = $term;

        }

        // Filtro por usuario que reporta
        if ($id_reporta !== null) {
            $whereConditions[] = 'id_usuario_reporta = :id_reporta';
            $params[':id_reporta'] = $id_reporta;
        }

        // Filtro por usuario reportado
        if ($id_reportado !== null) {
            $whereConditions[] = 'id_usuario_reportado = :id_reportado';
            $params[':id_reportado'] = $id_reportado;
        }

        // Filtro por fecha
        if ($fecha !== null) {
            $whereConditions[] = 'DATE(fecha_reporte) = :fecha';
            $params[':fecha'] = $fecha;
        }

        // Si existen filtros, los añadimos a la consulta
        if (!empty($whereConditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $whereConditions);
        }

        // Ordenamiento final
        $sql .= ' ORDER BY fecha_reporte DESC';

        // Ejecución con parámetros seguros
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
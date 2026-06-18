<?php
require_once __DIR__ . '/../models/ZonaOperativaModel.php';

class ZonaDomain
{
    private ZonaOperativaModel $model;

    public function __construct()
    {
        $this->model = new ZonaOperativaModel();
    }

    public function getAll(): array
    {
        return $this->model->findAll();
    }

    public function getById(int $id): ?array
    {
        return $this->model->findById($id);
    }

    public function create(string $nombre, string $codigoPostal): array
    {
        $nombre      = trim($nombre);
        $codigoPostal = trim($codigoPostal);

        if ($nombre === '' || $codigoPostal === '') {
            return ['success' => false, 'message' => 'Nombre y código postal son requeridos.'];
        }

        $id = $this->model->create($nombre, $codigoPostal);
        return ['success' => true, 'id_zona' => $id];
    }

    public function update(int $id, string $nombre, string $codigoPostal): array
    {
        $nombre      = trim($nombre);
        $codigoPostal = trim($codigoPostal);

        if ($nombre === '' || $codigoPostal === '') {
            return ['success' => false, 'message' => 'Nombre y código postal son requeridos.'];
        }

        $ok = $this->model->update($id, $nombre, $codigoPostal);
        return $ok
            ? ['success' => true]
            : ['success' => false, 'message' => 'No se pudo actualizar la zona.'];
    }

    public function toggle(int $id): array
    {
        $ok = $this->model->toggleActiva($id);
        return $ok
            ? ['success' => true]
            : ['success' => false, 'message' => 'No se pudo cambiar el estado de la zona.'];
    }
}

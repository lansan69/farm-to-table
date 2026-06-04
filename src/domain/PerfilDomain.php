<?php
require_once __DIR__ . '/../models/UsuarioModel.php';
require_once __DIR__ . '/../models/ValoracionReputacionModel.php';
require_once __DIR__ . '/../models/ZonaOperativaModel.php';

class PerfilDomain
{
    private UsuarioModel            $usuarioModel;
    private ValoracionReputacionModel $valoracionModel;
    private ZonaOperativaModel      $zonaModel;

    public function __construct()
    {
        $this->usuarioModel    = new UsuarioModel();
        $this->valoracionModel = new ValoracionReputacionModel();
        $this->zonaModel       = new ZonaOperativaModel();
    }

    /**
     * Perfil completo del comprador: stats + valoraciones recibidas.
     */
    public function getPerfilComprador(int $idUsuario): ?array
    {
        $perfil = $this->usuarioModel->getStatsComprador($idUsuario);
        if ($perfil === null) return null;

        $perfil['ubicacion']   = $this->usuarioModel->findById($idUsuario);
        $perfil['valoraciones'] = $this->valoracionModel->findByEvaluado($idUsuario);
        return $perfil;
    }

    /**
     * Perfil completo del productor: stats + valoraciones recibidas.
     */
    public function getPerfilProductor(int $idUsuario): ?array
    {
        $perfil = $this->usuarioModel->getStatsProductor($idUsuario);
        if ($perfil === null) return null;

        $perfil['ubicacion']   = $this->usuarioModel->findById($idUsuario);
        $perfil['valoraciones'] = $this->valoracionModel->findByEvaluado($idUsuario);
        return $perfil;
    }

    public function getValoraciones(int $idUsuario): array
    {
        return $this->valoracionModel->findByEvaluado($idUsuario);
    }

    /**
     * Registra una calificación al finalizar una entrega.
     * Valida que la entrega exista (la BD también tiene CHECK de 1-5 en estrellas).
     */
    public function registrarValoracion(
        int     $idEntrega,
        int     $idEvaluador,
        int     $idEvaluado,
        int     $estrellas,
        ?string $comentarios
    ): array {
        if ($estrellas < 1 || $estrellas > 5) {
            return ['success' => false, 'message' => 'La calificación debe estar entre 1 y 5.'];
        }

        $id = $this->valoracionModel->create($idEntrega, $idEvaluador, $idEvaluado, $estrellas, $comentarios);
        return ['success' => true, 'id_valoracion' => $id];
    }

    /**
     * Actualiza los datos editables del perfil (nombre, teléfono, zona).
     */
    public function updatePerfil(int $idUsuario, string $nombre, string $telefono, int $idZona): bool
    {
        return $this->usuarioModel->update($idUsuario, $nombre, $telefono, $idZona);
    }

    public function getZonasActivas(): array
    {
        return $this->zonaModel->findAllActivas();
    }
}

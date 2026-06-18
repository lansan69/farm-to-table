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
     * Perfil completo del comprador: datos de v_usuarios_zona + stats + valoraciones.
     * Los campos del usuario se devuelven al nivel raíz (sin anidar en 'ubicacion').
     */
    public function getPerfilComprador(int $idUsuario): ?array
    {
        $stats = $this->usuarioModel->getStatsComprador($idUsuario);
        if ($stats === null) return null;

        $datos = $this->usuarioModel->findByIdFromView($idUsuario) ?? [];

        return array_merge($datos, [
            'total_negociaciones'      => $stats['total_negociaciones'],
            'negociaciones_aceptadas'  => $stats['negociaciones_aceptadas'],
            'negociaciones_pendientes' => $stats['negociaciones_pendientes'],
            'valoraciones'             => $this->safeGetValoraciones($idUsuario),
        ]);
    }

    /**
     * Perfil completo del productor: datos de v_usuarios_zona + stats + valoraciones.
     * Los campos del usuario se devuelven al nivel raíz (sin anidar en 'ubicacion').
     */
    public function getPerfilProductor(int $idUsuario): ?array
    {
        $stats = $this->usuarioModel->getStatsProductor($idUsuario);
        if ($stats === null) return null;

        $datos = $this->usuarioModel->findByIdFromView($idUsuario) ?? [];

        return array_merge($datos, [
            'total_lotes'           => $stats['total_lotes'],
            'lotes_disponibles'     => $stats['lotes_disponibles'],
            'lotes_en_negociacion'  => $stats['lotes_en_negociacion'],
            'lotes_asignados'       => $stats['lotes_asignados'],
            'valoraciones'          => $this->safeGetValoraciones($idUsuario),
        ]);
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
     * Actualiza los datos editables del perfil.
     */
public function updatePerfil(
        int     $idUsuario,
        string  $nombre,
        ?string $apellido,
        string  $telefono,
        int     $idZona,
        ?string $email = null,
        ?string $foto_perfil = null
    ): bool {
        return $this->usuarioModel->update(
            $idUsuario, 
            $nombre, 
            $apellido, 
            $telefono, 
            $idZona, 
            $email, 
            $foto_perfil
        );
    }

    /**
     * Cambia la contraseña del usuario (hashea antes de guardar).
     */
    public function updatePassword(int $idUsuario, string $password): bool
    {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        return $this->usuarioModel->updatePassword($idUsuario, $hash);
    }

    public function getZonasActivas(): array
    {
        return $this->zonaModel->findAllActivas();
    }

    /** Returns valoraciones or empty array if the table does not yet exist. */
    private function safeGetValoraciones(int $idUsuario): array
    {
        try {
            return $this->valoracionModel->findByEvaluado($idUsuario);
        } catch (\PDOException $e) {
            return [];
        }
    }
}

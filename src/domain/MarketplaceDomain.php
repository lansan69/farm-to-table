<?php
require_once __DIR__ . '/../models/LoteExcedenteModel.php';
require_once __DIR__ . '/../models/CategoriaProductoModel.php';
require_once __DIR__ . '/../models/FavoritoModel.php';

class MarketplaceDomain
{
    private LoteExcedenteModel    $loteModel;
    private CategoriaProductoModel $categoriaModel;
    private FavoritoModel         $favoritoModel;

    public function __construct()
    {
        $this->loteModel      = new LoteExcedenteModel();
        $this->categoriaModel = new CategoriaProductoModel();
        $this->favoritoModel  = new FavoritoModel();
    }

    // ── Listado y búsqueda ───────────────────────────────────────────────────

    public function getLotes(?string $nombre = null, ?int $idCategoria = null): array
    {
        return $this->loteModel->buscar($nombre, $idCategoria);
    }

    public function getDetalleLote(int $idLote): ?array
    {
        return $this->loteModel->findByIdDetalle($idLote);
    }

    public function getCategorias(): array
    {
        return $this->categoriaModel->findAll();
    }

    // ── Favoritos ────────────────────────────────────────────────────────────

    public function getFavoritos(int $idUsuario): array
    {
        return $this->favoritoModel->findByUsuario($idUsuario);
    }

    /**
     * Alterna el estado favorito de un lote para un usuario.
     * Devuelve la acción ejecutada: 'added' o 'removed'.
     */
    public function toggleFavorito(int $idUsuario, int $idLote): array
    {
        if ($this->favoritoModel->existe($idUsuario, $idLote)) {
            $this->favoritoModel->eliminar($idUsuario, $idLote);
            return ['success' => true, 'action' => 'removed'];
        }

        $this->favoritoModel->agregar($idUsuario, $idLote);
        return ['success' => true, 'action' => 'added'];
    }

    public function esFavorito(int $idUsuario, int $idLote): bool
    {
        return $this->favoritoModel->existe($idUsuario, $idLote);
    }
}

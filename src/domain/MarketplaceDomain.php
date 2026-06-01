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

    /**
     * Devuelve los lotes disponibles. Acepta filtros opcionales.
     */
    public function getLotes(
        ?string $nombre      = null,
        ?int    $idCategoria = null,
        ?int    $idZona      = null
    ): array {
        return $this->loteModel->buscar($nombre, $idCategoria, $idZona);
    }

    /**
     * Vista individual de producto: datos base + fotos del lote.
     */
    public function getDetalleLote(int $idLote): array
    {
        $filas = $this->loteModel->findByIdDetalle($idLote);
        if (empty($filas)) return [];

        $lote  = $filas[0];
        $fotos = array_values(array_filter(
            array_map(fn($f) => $f['id_foto'] !== null ? [
                'id_foto'    => $f['id_foto'],
                'url_foto'   => $f['url_foto'],
                'fecha_foto' => $f['fecha_foto'],
            ] : null, $filas)
        ));

        unset($lote['id_foto'], $lote['url_foto'], $lote['fecha_foto']);
        $lote['fotos'] = $fotos;
        return $lote;
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

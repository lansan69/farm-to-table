<?php
require_once __DIR__ . '/../models/LoteExcedenteModel.php';
require_once __DIR__ . '/../models/EvidenciaFotograficaModel.php';
require_once __DIR__ . '/../models/HistorialTrazabilidadModel.php';
require_once __DIR__ . '/../models/CategoriaProductoModel.php';
require_once __DIR__ . '/../models/CatalogoProductoModel.php';
require_once __DIR__ . '/../core/Database.php';

class LoteDomain
{
    private LoteExcedenteModel      $loteModel;
    private EvidenciaFotograficaModel $fotoModel;
    private HistorialTrazabilidadModel $trazabilidadModel;
    private CategoriaProductoModel  $categoriaModel;
    private CatalogoProductoModel   $catalogoModel;

    public function __construct()
    {
        $this->loteModel         = new LoteExcedenteModel();
        $this->fotoModel         = new EvidenciaFotograficaModel();
        $this->trazabilidadModel = new HistorialTrazabilidadModel();
        $this->categoriaModel    = new CategoriaProductoModel();
        $this->catalogoModel     = new CatalogoProductoModel();
    }

    // ── Navegador / Catálogo ──────────────────────────────────────────────────

    public function getLotesDisponibles(): array
    {
        return $this->loteModel->findAllDisponibles();
    }

    public function getLotesUrgentes(): array
    {
        return $this->loteModel->findUrgentes();
    }

    /**
     * Búsqueda combinada de lotes. Pasa null en los parámetros que no apliquen.
     */
    public function buscarLotes(?string $nombre, ?int $idCategoria, ?int $idZona): array
    {
        return $this->loteModel->buscar($nombre, $idCategoria, $idZona);
    }

    /**
     * Devuelve el detalle completo de un lote: datos base, fotos aplanadas e historial.
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
        $lote['fotos']        = $fotos;
        $lote['trazabilidad'] = $this->trazabilidadModel->findByLote($idLote);

        return $lote;
    }

    // ── Panel del Productor ───────────────────────────────────────────────────

    public function getLotesProductor(int $idProductor): array
    {
        return $this->loteModel->findByProductor($idProductor);
    }

    /**
     * Publica un nuevo lote: inserta el lote, registra el evento inicial en
     * trazabilidad y adjunta fotos; todo dentro de una transacción.
     *
     */
public function publicarLote(
        int     $idProductor,
        string  $nombre,
        int     $idCategoria,
        float   $cantidad,
        float   $precio,
        string  $fechaCosecha,
        ?string $descripcion = null,
        ?string $foto = null,
        ?int    $idProducto = null
    ): array {
        $db = Database::getInstance()->getConnection();
        $db->beginTransaction();
        try {
            $idLote = $this->loteModel->create(
                idProductor:  $idProductor,
                nombre:       $nombre,
                idCategoria:  $idCategoria,
                cantidad:     $cantidad,
                precio:       $precio,
                fechaCosecha: $fechaCosecha,
                descripcion:  $descripcion,
                foto:         $foto,
                idProducto:   $idProducto
            );

            $db->commit();
            return ['success' => true, 'id_lote' => $idLote];
        } catch (\Throwable $e) {
            $db->rollBack();
            $msg = defined('DEBUG') && DEBUG ? $e->getMessage() : 'Error al publicar el lote.';
            return ['success' => false, 'message' => $msg];
        }
    }

public function actualizarLote(
        int     $idLote,
        int     $idProductor,
        string  $nombre,
        int     $idCategoria,
        float   $cantidad,
        float   $precio,
        string  $fechaCosecha,
        ?string $descripcion = null,
        ?string $foto = null,
        ?int    $idProducto = null
    ): array {
        $db = Database::getInstance()->getConnection();
        $db->beginTransaction();
        try {
            // Solo ejecutamos la edición, no reasignamos el $idLote
            $this->loteModel->edit(
                idLote:       $idLote,
                idProductor:  $idProductor,
                nombre:       $nombre,
                idCategoria:  $idCategoria,
                cantidad:     $cantidad,
                precio:       $precio,
                fechaCosecha: $fechaCosecha,
                descripcion:  $descripcion,
                foto:         $foto,
                idProducto:   $idProducto
            );

            $db->commit();
            // Devolvemos el mismo $idLote que nos pasaron por parámetro
            return ['success' => true, 'id_lote' => $idLote];
        } catch (\Throwable $e) {
            $db->rollBack();
            $msg = defined('DEBUG') && DEBUG ? $e->getMessage() : 'Error al actualizar el lote.';
            return ['success' => false, 'message' => $msg];
        }
    }
    /**
     * Cambia el estado de un lote. Solo el productor dueño puede modificarlo.
     */
    public function cambiarEstadoLote(int $idLote, int $idProductor, string $estado): bool
    {
        $validos = ['disponible', 'en_negociacion', 'asignado', 'caducado', 'eliminado'];
        if (!in_array($estado, $validos, true)) return false;
        return $this->loteModel->updateEstado($idLote, $idProductor, $estado);
    }

    /**
     * Agrega una foto de evidencia a un lote existente y registra el evento.
     */
    public function agregarFoto(int $idLote, int $idUsuario, string $url): bool
    {
        $this->fotoModel->create($idLote, $url);
        $this->trazabilidadModel->create($idLote, $idUsuario, "Foto de evidencia agregada: {$url}");
        return true;
    }

    // ── Catálogo y Categorías ────────────────────────────────────────────────

    public function getCategorias(): array
    {
        return $this->categoriaModel->findAll();
    }

    public function getCatalogo(): array
    {
        return $this->catalogoModel->findAll();
    }

    public function buscarProductos(string $nombre): array
    {
        return $this->catalogoModel->findByNombre($nombre);
    }
}

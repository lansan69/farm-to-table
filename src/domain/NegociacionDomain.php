<?php
require_once __DIR__ . '/../models/NegociacionModel.php';
require_once __DIR__ . '/../models/DetalleOfertaModel.php';

class NegociacionDomain
{
    private NegociacionModel  $negociacionModel;
    private DetalleOfertaModel $detalleModel;

    public function __construct()
    {
        $this->negociacionModel = new NegociacionModel();
        $this->detalleModel     = new DetalleOfertaModel();
    }

    // ── Consultas ────────────────────────────────────────────────────────────

    public function getNegociacionesComprador(int $idComprador): array
    {
        return $this->negociacionModel->findByComprador($idComprador);
    }

    public function getNegociacionesProductor(int $idProductor): array
    {
        return $this->negociacionModel->findByProductor($idProductor);
    }

    public function getHistorialComprador(int $idComprador): array
    {
        return $this->negociacionModel->findHistorialComprador($idComprador);
    }

    public function getHistorialProductor(int $idProductor): array
    {
        return $this->negociacionModel->findHistorialProductor($idProductor);
    }

    /**
     * Devuelve el hilo de ofertas de una negociación (usado como chat de negociación).
     */
    public function getHiloOfertas(int $idNegociacion): array
    {
        return $this->detalleModel->findByNegociacion($idNegociacion);
    }

    // ── Acciones ─────────────────────────────────────────────────────────────

    /**
     * El comprador inicia una negociación con su primera oferta.
     */
    public function iniciarNegociacion(
        int     $idLote,
        int     $idComprador,
        float   $monto,
        ?string $comentario
    ): array {
        $idNegociacion = $this->negociacionModel->create($idLote, $idComprador);
        $this->detalleModel->create($idNegociacion, $idComprador, $monto, $comentario);
        return ['success' => true, 'id_negociacion' => $idNegociacion];
    }

    /**
     * Cualquiera de las partes envía una nueva ronda de oferta.
     * Actualiza el estado a 'contraoferta_productor' para que la UI
     * sepa que el productor tiene el turno.
     */
    public function enviarContraoferta(
        int     $idNegociacion,
        int     $idEmisor,
        float   $monto,
        ?string $comentario
    ): array {
        $neg = $this->negociacionModel->findById($idNegociacion);
        if ($neg === null) {
            return ['success' => false, 'message' => 'Negociación no encontrada.'];
        }
        if (in_array($neg['estado_negociacion'], ['aceptada', 'rechazada'], true)) {
            return ['success' => false, 'message' => 'La negociación ya está cerrada.'];
        }

        $this->detalleModel->create($idNegociacion, $idEmisor, $monto, $comentario);
        $this->negociacionModel->updateEstado($idNegociacion, 'contraoferta_productor');

        return ['success' => true];
    }

    /**
     * Acepta la última oferta. El trigger de BD crea la entrega logística automáticamente.
     */
    public function aceptar(int $idNegociacion): bool
    {
        return $this->negociacionModel->updateEstado($idNegociacion, 'aceptada');
    }

    public function rechazar(int $idNegociacion): bool
    {
        return $this->negociacionModel->updateEstado($idNegociacion, 'rechazada');
    }
}

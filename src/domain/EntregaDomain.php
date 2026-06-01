<?php
require_once __DIR__ . '/../models/EntregaLogisticaModel.php';

class EntregaDomain
{
    private EntregaLogisticaModel $entregaModel;

    public function __construct()
    {
        $this->entregaModel = new EntregaLogisticaModel();
    }

    public function getEntregaPorNegociacion(int $idNegociacion): ?array
    {
        return $this->entregaModel->findByNegociacion($idNegociacion);
    }

    /**
     * Busca una entrega por su código QR para mostrar información antes de confirmar.
     */
    public function verificarQR(string $codigo): ?array
    {
        return $this->entregaModel->findByCodigoQR($codigo);
    }

    /**
     * El comprador escanea el QR al recibir el pedido y confirma la recepción.
     */
    public function confirmarRecepcion(string $codigoQR): array
    {
        $entrega = $this->entregaModel->findByCodigoQR($codigoQR);
        if ($entrega === null) {
            return ['success' => false, 'message' => 'Código QR no válido.'];
        }
        if ($entrega['estado_entrega'] === 'entregado') {
            return ['success' => false, 'message' => 'Esta entrega ya fue registrada.'];
        }

        $this->entregaModel->registrarRecepcion($entrega['id_entrega']);
        return ['success' => true, 'id_entrega' => $entrega['id_entrega']];
    }

    /**
     * Actualiza el estado logístico de una entrega (productor o admin).
     */
    public function actualizarEstado(int $idEntrega, string $estado): bool
    {
        $validos = ['preparando_lote', 'en_transito', 'entregado', 'incidencia'];
        if (!in_array($estado, $validos, true)) return false;
        return $this->entregaModel->updateEstado($idEntrega, $estado);
    }
}

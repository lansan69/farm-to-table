-- Vista: Listado de contraofertas para la vista del Cliente
-- Devuelve: id_negociacion, id_comprador, producto, cantidad, precio_original, precio_contraoferta, estado
-- Autor: Nayeli Adriana Ruiz Salgado
-- Fecha: 2026-05-26

CREATE OR REPLACE VIEW contraofertas_cliente AS
SELECT 
    n.id_negociacion,
    n.id_comprador,
    cp.nombre_producto AS producto,
    le.cantidad_kg AS cantidad,
    le.precio_recuperacion_sugerido AS precio_original,
    (SELECT d.monto_propuesto 
     FROM detalles_ofertas d 
     WHERE d.id_negociacion = n.id_negociacion 
     ORDER BY d.fecha_envio DESC LIMIT 1) AS precio_contraoferta,
    n.estado_negociacion AS estado
FROM negociaciones_contraoferta n
JOIN lotes_excedentes le ON n.id_lote = le.id_lote
JOIN catalogo_productos cp ON le.id_producto = cp.id_producto;
-- Vista: Listado de contraofertas recibidas por el Productor
-- Devuelve: id_negociacion, id_productor, producto, cantidad, precio_original, precio_contraoferta, estado
-- Autor: Nayeli Adriana Ruiz Salgado
-- Fecha: 2026-05-26

CREATE OR REPLACE VIEW contraofertas_productor AS
SELECT 
    n.id_negociacion,
    le.id_productor,
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
-- ==========================================================================================================
-- Nombre: Andrés García
-- Fecha: 2026-05-25
-- Modulo: Detalle del lote 
-- Descripcion: Consulta para poder ver todos los detalles relacionados con respecto a un lote
-- ==========================================================================================================
-- Consulta: La consulta devuelve el id del lote, el nombre de usuario como nombre_productor, el nombre del producto, la cantidad disponible,
-- la fecha de cosecha de dicho lote, el estado del lote y la fecha que fue publlicado
CREATE VIEW detalles_lote AS SELECT le.id_lote,u.nombre_razon_social AS nombre_productor,cp.nombre_producto,
le.cantidad_kg,le.fecha_cosecha,le.estado_lote,le.fecha_publicacion
FROM lotes_excedentes le
INNER JOIN usuarios u 
    ON le.id_productor = u.id_usuario
INNER JOIN catalogo_productos cp 
    ON le.id_producto = cp.id_producto;
	
-- Posterior a la creacion de esta vista se puede consultar todo esta informacion a traves de esta consulta
SELECT * FROM detalles_lote where id_lote=3;
-- Solo se debe reemplazar el id del lote, por el id del lote de interes

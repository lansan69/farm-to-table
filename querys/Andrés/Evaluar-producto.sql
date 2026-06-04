-- ===================================================================================
-- Nombre: Andrés García 
-- Fecha: 2026-05-25
-- Modulo: Evaluar producto/vendedor
-- Descripcion: Consulta para poder ver los comentarios sobre un producto y/o vendedor
-- ===================================================================================
-- Consulta: La consulta devuelve el id de la entega (compra), el id de la valoracion (numero de opinion), el nombre del evaluador y del evaluado,
-- asi como la calificacion dada al producto, el comentario y finalmente la fecha en que fue dado el comentario
CREATE VIEW resenas AS SELECT 
    el.id_entrega AS orden_compra,
    vr.id_valoracion AS numero_de_opinion,
    ue.nombre_razon_social AS nombre_evaluador,
    uu.nombre_razon_social AS nombre_evaluado,
    vr.calificacion_estrellas AS calificacion,
    vr.comentarios, vr.fecha_valoracion 
FROM entregas_logistica el
INNER JOIN valoraciones_reputacion vr 
    ON el.id_entrega = vr.id_entrega
INNER JOIN usuarios ue 
    ON ue.id_usuario = vr.id_usuario_evaluador
INNER JOIN usuarios uu 
    ON uu.id_usuario = vr.id_usuario_evaluado;
	
-- Posterior a la creacion de esta vista se puede consultar la informacion antes menciondad para hacer diferentes tipos de consulta

-- Consulta General: Muestra todos los comentarios existentes
SELECT * FROM resenas;
-- Consulta Vendedores: Ofrece un resumen de cada nombre evaluado que existe
SELECT 
    nombre_evaluado,
    COUNT(*) AS total_resenas,
    AVG(calificacion) AS promedio_calificacion,
    MAX(fecha_valoracion) AS ultima_valoracion
FROM resenas
GROUP BY nombre_evaluado;
-- Consulta Especifica: Muestra todas las reseñas de un evaluado en especifico
SELECT 
    numero_de_opinion,nombre_evaluado,calificacion,
    comentarios, fecha_valoracion
FROM resenas
WHERE nombre_evaluado = 'Juan Pérez'; 

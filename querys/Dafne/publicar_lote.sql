-- ------------------------------------------------------------
-- VISTA 2: vi_mis_lotes_productor
-- Pantalla: Publicar Lote / Mis Lotes
-- Muestra los lotes publicados con productor, producto,
-- zona, estado y foto principal
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vi_mis_lotes_productor AS
SELECT
    le.id_lote,
    le.id_productor,
    u.nombre_razon_social   AS productor,
    cp.nombre_producto,
    cat.nombre_categoria,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido AS precio_kg,
    le.fecha_cosecha,
    le.estado_lote,
    le.fecha_publicacion,
    ef.url_archivo          AS foto_principal
FROM
    lotes_excedentes le
    JOIN usuarios u
        ON le.id_productor = u.id_usuario
    JOIN catalogo_productos cp
        ON le.id_producto = cp.id_producto
    JOIN categorias_productos cat
        ON cp.id_categoria = cat.id_categoria
    LEFT JOIN evidencias_fotograficas ef
        ON le.id_lote = ef.id_lote;

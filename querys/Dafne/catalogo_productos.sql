-- ------------------------------------------------------------
-- VISTA 1: vi_catalogo_productos
-- Pantalla: Gestión de Catálogo
-- Muestra cada producto con su categoría y vida útil
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vi_catalogo_productos AS
SELECT
    cp.id_producto,
    cp.id_categoria,
    cat.nombre_categoria,
    cp.nombre_producto,
    cp.vida_util_promedio_dias
FROM
    catalogo_productos cp
    JOIN categorias_productos cat
        ON cp.id_categoria = cat.id_categoria;

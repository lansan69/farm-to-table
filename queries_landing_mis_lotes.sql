-- ============================================================
--  FARM TO TABLE — Queries correspondientes a:
--  1. Landing Page
--  2. Mis Lotes
--
--  Autor: Bayron Yael Hernandez Aguirre
--  Base de datos: farm_to_table_db
-- ============================================================


-- ============================================================
--  LANDING PAGE
-- ============================================================

-- ------------------------------------------------------------
-- SELECT 1: Lotes disponibles para mostrar en la landing page
-- Muestra los lotes activos con nombre de producto, categoría,
-- precio sugerido, cantidad y foto principal del productor.
-- ------------------------------------------------------------
SELECT
    le.id_lote,
    u.nombre_razon_social          AS productor,
    cp.nombre_producto,
    cat.nombre_categoria           AS categoria,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido AS precio,
    le.fecha_cosecha,
    le.estado_lote,
    ef.url_archivo                 AS foto_principal
FROM lotes_excedentes le
JOIN usuarios            u   ON le.id_productor = u.id_usuario
JOIN catalogo_productos  cp  ON le.id_producto  = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
LEFT JOIN evidencias_fotograficas ef
    ON ef.id_lote = le.id_lote
    AND ef.id_foto = (
        SELECT MIN(id_foto)
        FROM evidencias_fotograficas
        WHERE id_lote = le.id_lote
    )
WHERE le.estado_lote = 'disponible'
ORDER BY le.fecha_publicacion DESC;


-- ------------------------------------------------------------
-- SELECT 2: Categorías con conteo de lotes disponibles
-- Para mostrar las tarjetas de categorías en la landing.
-- ------------------------------------------------------------
SELECT
    cat.id_categoria,
    cat.nombre_categoria,
    cat.descripcion,
    COUNT(le.id_lote) AS total_lotes_disponibles
FROM categorias_productos cat
LEFT JOIN catalogo_productos cp  ON cp.id_categoria = cat.id_categoria
LEFT JOIN lotes_excedentes   le  ON le.id_producto  = cp.id_producto
                                 AND le.estado_lote  = 'disponible'
GROUP BY cat.id_categoria, cat.nombre_categoria, cat.descripcion
ORDER BY total_lotes_disponibles DESC;


-- ------------------------------------------------------------
-- SELECT 3: Estadísticas generales para la barra de stats
-- (340+ productores, 1200 lotes, 18 estados → adaptado a la BD real)
-- ------------------------------------------------------------
SELECT
    (SELECT COUNT(*)
     FROM usuarios
     WHERE rol_usuario = 'productor')                       AS total_productores,

    (SELECT COUNT(*)
     FROM lotes_excedentes
     WHERE estado_lote = 'disponible')                      AS lotes_disponibles,

    (SELECT COUNT(DISTINCT id_zona)
     FROM usuarios
     WHERE rol_usuario = 'productor')                       AS zonas_cubiertas;


-- ============================================================
--  MIS LOTES  (vista del productor autenticado)
--  Se usa :id_productor como parámetro del usuario en sesión.
-- ============================================================

-- ------------------------------------------------------------
-- SELECT 4: Todos los lotes del productor autenticado
-- Incluye nombre de producto, categoría, cantidad,
-- precio, estado y foto principal.
-- ------------------------------------------------------------
SELECT
    le.id_lote,
    cp.nombre_producto,
    cat.nombre_categoria,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido AS precio,
    le.fecha_cosecha,
    le.fecha_publicacion,
    le.estado_lote,
    ef.url_archivo AS foto_principal
FROM lotes_excedentes le
JOIN catalogo_productos   cp  ON le.id_producto  = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria  = cat.id_categoria
LEFT JOIN evidencias_fotograficas ef
    ON ef.id_lote = le.id_lote
    AND ef.id_foto = (
        SELECT MIN(id_foto)
        FROM evidencias_fotograficas
        WHERE id_lote = le.id_lote
    )
WHERE le.id_productor = :id_productor
ORDER BY le.fecha_publicacion DESC;


-- ------------------------------------------------------------
-- SELECT 5: Conteo de lotes por estado (para las tarjetas
-- de estadísticas en la parte superior de Mis Lotes)
-- ------------------------------------------------------------
SELECT
    COUNT(*)                                              AS total_lotes,
    SUM(estado_lote = 'disponible')                       AS activos,
    SUM(estado_lote = 'en_negociacion')                   AS en_negociacion,
    SUM(estado_lote = 'asignado')                         AS asignados,
    SUM(estado_lote = 'caducado')                         AS caducados
FROM lotes_excedentes
WHERE id_productor = :id_productor;


-- ------------------------------------------------------------
-- SELECT 6: Detalle de un lote específico
-- (para el modal de edición o vista de detalle)
-- ------------------------------------------------------------
SELECT
    le.id_lote,
    le.id_producto,
    cp.nombre_producto,
    cat.nombre_categoria,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido,
    le.fecha_cosecha,
    le.estado_lote,
    le.fecha_publicacion,
    GROUP_CONCAT(ef.url_archivo ORDER BY ef.id_foto SEPARATOR ', ') AS fotos
FROM lotes_excedentes le
JOIN catalogo_productos   cp  ON le.id_producto  = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria  = cat.id_categoria
LEFT JOIN evidencias_fotograficas ef ON ef.id_lote = le.id_lote
WHERE le.id_lote      = :id_lote
  AND le.id_productor = :id_productor
GROUP BY le.id_lote;


-- ============================================================
--  INSERT
-- ============================================================

-- ------------------------------------------------------------
-- INSERT 1: Publicar un lote nuevo
-- ------------------------------------------------------------
INSERT INTO lotes_excedentes
    (id_productor, id_producto, cantidad_kg,
     fecha_cosecha, precio_recuperacion_sugerido, estado_lote)
VALUES
    (:id_productor, :id_producto, :cantidad_kg,
     :fecha_cosecha, :precio_sugerido, 'disponible');


-- ------------------------------------------------------------
-- INSERT 2: Subir foto de evidencia a un lote recién creado
-- ------------------------------------------------------------
INSERT INTO evidencias_fotograficas
    (id_lote, url_archivo)
VALUES
    (:id_lote, :url_archivo);


-- ============================================================
--  UPDATE
-- ============================================================

-- ------------------------------------------------------------
-- UPDATE 1: Editar precio y cantidad de un lote propio
-- ------------------------------------------------------------
UPDATE lotes_excedentes
SET
    precio_recuperacion_sugerido = :nuevo_precio,
    cantidad_kg                  = :nueva_cantidad
WHERE id_lote      = :id_lote
  AND id_productor = :id_productor;


-- ------------------------------------------------------------
-- UPDATE 2: Cambiar el estado de un lote
-- (ej. pasar a 'caducado' cuando el productor lo da de baja)
-- ------------------------------------------------------------
UPDATE lotes_excedentes
SET estado_lote = :nuevo_estado
WHERE id_lote      = :id_lote
  AND id_productor = :id_productor;


-- ============================================================
--  TRIGGERS
-- ============================================================

-- ------------------------------------------------------------
-- TRIGGER 1: Después de publicar un lote, registrar
-- automáticamente el evento en historial_trazabilidad.
-- (El backend no necesita hacer nada extra.)
-- ------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_after_insert_lote
AFTER INSERT ON lotes_excedentes
FOR EACH ROW
BEGIN
    INSERT INTO historial_trazabilidad
        (id_lote, id_usuario_responsable, evento_descripcion)
    VALUES (
        NEW.id_lote,
        NEW.id_productor,
        CONCAT(
            'Lote publicado: ',
            NEW.cantidad_kg,
            ' kg — Precio sugerido: $',
            NEW.precio_recuperacion_sugerido
        )
    );
END$$

DELIMITER ;


-- ------------------------------------------------------------
-- TRIGGER 2: Cuando el estado de un lote cambia a 'caducado',
-- registrar automáticamente el evento en historial_trazabilidad.
-- ------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_after_update_estado_lote
AFTER UPDATE ON lotes_excedentes
FOR EACH ROW
BEGIN
    IF NEW.estado_lote <> OLD.estado_lote THEN
        INSERT INTO historial_trazabilidad
            (id_lote, id_usuario_responsable, evento_descripcion)
        VALUES (
            NEW.id_lote,
            NEW.id_productor,
            CONCAT(
                'Estado del lote cambió de "',
                OLD.estado_lote,
                '" a "',
                NEW.estado_lote,
                '"'
            )
        );
    END IF;
END$$

DELIMITER ;


-- ------------------------------------------------------------
-- TRIGGER 3: Cuando se acepta una negociación
-- (estado_negociacion = 'aceptada'), actualizar automáticamente
-- el lote a 'asignado' sin que el backend lo haga manualmente.
-- ------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_after_negociacion_aceptada
AFTER UPDATE ON negociaciones_contraoferta
FOR EACH ROW
BEGIN
    IF NEW.estado_negociacion = 'aceptada'
       AND OLD.estado_negociacion <> 'aceptada' THEN

        UPDATE lotes_excedentes
        SET estado_lote = 'asignado'
        WHERE id_lote = NEW.id_lote;

    END IF;
END$$

DELIMITER ;

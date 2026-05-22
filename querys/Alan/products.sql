-- ===========================================================================
-- Módulo: Catálogo y Navegador de Lotes
-- Descripción: Vistas y consultas para explorar lotes excedentes disponibles,
--              ver el detalle de un lote, publicar nuevos lotes y gestionar
--              el inventario desde el panel del productor.
--
-- DEPENDENCIA: Este módulo usa el campo `puntuacion_promedio` de la tabla
--              `usuarios`. Ejecutar primero la SECCIÓN 0 de usuarios.sql.
-- ===========================================================================


-- ===========================================================================
-- SECCIÓN 1: Catálogo — Categorías y Productos Base
-- Consultas para cargar datos del catálogo en menús, filtros y autocomplete
-- ===========================================================================

-- Obtener todas las categorías para el menú de navegación y filtros
SELECT id_categoria, nombre_categoria
FROM categorias_productos
ORDER BY nombre_categoria;

-- Obtener todos los productos con su categoría (útil para autocomplete al publicar un lote)
SELECT
    cp.id_producto,
    cp.nombre_producto,
    cp.vida_util_promedio_dias,
    cat.id_categoria,
    cat.nombre_categoria
FROM catalogo_productos cp
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
ORDER BY cat.nombre_categoria, cp.nombre_producto;

-- Buscar producto por nombre (para autocomplete al registrar un lote)
SELECT id_producto, nombre_producto, vida_util_promedio_dias, id_categoria
FROM catalogo_productos
WHERE nombre_producto LIKE ?;


-- ===========================================================================
-- SECCIÓN 2: Navegador — Vista Principal de Lotes Disponibles
-- Agrega toda la info necesaria para renderizar una tarjeta (card) de lote
-- ===========================================================================

-- Vista principal del navegador. Solo expone lotes en estado 'disponible'.
-- Incluye días de vida útil restantes para destacar urgencia en la interfaz.
CREATE OR REPLACE VIEW vw_lotes_navegador AS
SELECT
    le.id_lote,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido,
    le.fecha_cosecha,
    le.fecha_publicacion,
    le.estado_lote,
    -- Días de vida útil que le quedan al lote a partir de hoy
    (cp.vida_util_promedio_dias - DATEDIFF(CURDATE(), le.fecha_cosecha)) AS dias_restantes_vida_util,
    -- Producto
    cp.id_producto,
    cp.nombre_producto,
    cp.vida_util_promedio_dias,
    -- Categoría
    cat.id_categoria,
    cat.nombre_categoria,
    -- Productor
    u.id_usuario  AS id_productor,
    u.nombre_razon_social AS nombre_productor,
    u.puntuacion_promedio AS reputacion_productor,
    -- Zona operativa del productor
    z.id_zona,
    z.nombre_delegacion,
    z.codigo_postal,
    -- Foto representativa del lote para la tarjeta
    f.url_archivo AS url_primera_foto
FROM lotes_excedentes le
JOIN catalogo_productos cp    ON le.id_producto  = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
JOIN usuarios u               ON le.id_productor = u.id_usuario
JOIN zonas_operativas z       ON u.id_zona       = z.id_zona
LEFT JOIN (
    -- Se toma MIN(url_archivo) para obtener siempre la misma foto representativa por lote
    SELECT id_lote, MIN(url_archivo) AS url_archivo
    FROM evidencias_fotograficas
    GROUP BY id_lote
) f ON le.id_lote = f.id_lote
WHERE le.estado_lote = 'disponible';


-- ===========================================================================
-- SECCIÓN 3: Búsquedas y Filtros del Navegador
-- Consultas sobre vw_lotes_navegador para los distintos casos de uso
-- ===========================================================================

-- Listar todos los lotes disponibles, de más reciente a más antiguo
SELECT * FROM vw_lotes_navegador
ORDER BY fecha_publicacion DESC;

-- Buscar lotes por nombre de producto (búsqueda libre de texto)
SELECT * FROM vw_lotes_navegador
WHERE nombre_producto LIKE ?
ORDER BY fecha_publicacion DESC;

-- Filtrar lotes por categoría
SELECT * FROM vw_lotes_navegador
WHERE id_categoria = ?
ORDER BY fecha_publicacion DESC;

-- Filtrar lotes por zona operativa
SELECT * FROM vw_lotes_navegador
WHERE id_zona = ?
ORDER BY fecha_publicacion DESC;

-- Filtrar lotes con al menos N días de vida útil restantes
SELECT * FROM vw_lotes_navegador
WHERE dias_restantes_vida_util >= ?
ORDER BY dias_restantes_vida_util ASC;

-- Lotes urgentes: vencen en los próximos 3 días (para destacar en la interfaz)
SELECT * FROM vw_lotes_navegador
WHERE dias_restantes_vida_util BETWEEN 0 AND 3
ORDER BY dias_restantes_vida_util ASC;

-- Búsqueda combinada: texto + categoría + zona
-- Pasar NULL en los parámetros que no apliquen para ignorarlos
SELECT * FROM vw_lotes_navegador
WHERE (? IS NULL OR nombre_producto LIKE ?)
  AND (? IS NULL OR id_categoria    =  ?)
  AND (? IS NULL OR id_zona         =  ?)
ORDER BY fecha_publicacion DESC;


-- ===========================================================================
-- SECCIÓN 4: Detalle de un Lote
-- Para la pantalla de detalle al hacer clic en una tarjeta del navegador
-- ===========================================================================

-- Vista de detalle completo de un lote. Genera una fila por cada foto del lote.
-- Si se necesita aplanar las fotos en un arreglo, usar GROUP_CONCAT desde el código.
CREATE OR REPLACE VIEW vw_detalle_lote AS
SELECT
    le.id_lote,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido,
    le.fecha_cosecha,
    le.fecha_publicacion,
    le.estado_lote,
    (cp.vida_util_promedio_dias - DATEDIFF(CURDATE(), le.fecha_cosecha)) AS dias_restantes_vida_util,
    -- Producto
    cp.id_producto,
    cp.nombre_producto,
    cp.vida_util_promedio_dias,
    -- Categoría
    cat.id_categoria,
    cat.nombre_categoria,
    -- Productor (incluye teléfono para posible contacto directo)
    u.id_usuario AS id_productor,
    u.nombre_razon_social AS nombre_productor,
    u.telefono_contacto   AS telefono_productor,
    u.puntuacion_promedio AS reputacion_productor,
    -- Zona
    z.id_zona,
    z.nombre_delegacion,
    z.codigo_postal,
    -- Fotos del lote — NULL si no hay fotos registradas
    ef.id_foto,
    ef.url_archivo AS url_foto,
    ef.fecha_subida AS fecha_foto
FROM lotes_excedentes le
JOIN catalogo_productos cp    ON le.id_producto  = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
JOIN usuarios u               ON le.id_productor = u.id_usuario
JOIN zonas_operativas z       ON u.id_zona       = z.id_zona
LEFT JOIN evidencias_fotograficas ef ON le.id_lote = ef.id_lote;

-- Obtener detalle completo de un lote específico (con todas sus fotos)
SELECT * FROM vw_detalle_lote WHERE id_lote = ?;

-- Obtener solo las fotos de un lote (para carrusel de imágenes en el detalle)
SELECT id_foto, url_archivo, fecha_subida
FROM evidencias_fotograficas
WHERE id_lote = ?
ORDER BY fecha_subida ASC;

-- Obtener el historial de trazabilidad de un lote (línea de tiempo en el detalle)
SELECT
    ht.id_trazabilidad,
    ht.evento_descripcion,
    ht.fecha_evento,
    u.nombre_razon_social AS responsable
FROM historial_trazabilidad ht
JOIN usuarios u ON ht.id_usuario_responsable = u.id_usuario
WHERE ht.id_lote = ?
ORDER BY ht.fecha_evento ASC;


-- ===========================================================================
-- SECCIÓN 5: Publicación de Nuevos Lotes (Acción del Productor)
-- Flujo obligatorio: 1. Insertar lote → 2. Registrar trazabilidad → 3. Agregar fotos
-- ===========================================================================

-- Paso 1: Registrar el nuevo lote excedente
-- Parámetros: id_productor, id_producto, cantidad_kg, fecha_cosecha, precio_recuperacion_sugerido
INSERT INTO lotes_excedentes (id_productor, id_producto, cantidad_kg, fecha_cosecha, precio_recuperacion_sugerido)
VALUES (?, ?, ?, ?, ?);

-- Paso 2: Registrar el evento inicial en la trazabilidad (llamar justo después del INSERT anterior)
-- Parámetros: id_lote (LAST_INSERT_ID()), id_usuario_responsable, descripcion_del_evento
INSERT INTO historial_trazabilidad (id_lote, id_usuario_responsable, evento_descripcion)
VALUES (LAST_INSERT_ID(), ?, ?);

-- Paso 3: Agregar fotos de evidencia al lote (repetir por cada foto)
-- Parámetros: id_lote, url_archivo
INSERT INTO evidencias_fotograficas (id_lote, url_archivo)
VALUES (?, ?);

-- Registrar un evento de trazabilidad manualmente (notas adicionales, inspecciones, etc.)
-- Parámetros: id_lote, id_usuario_responsable, descripcion
INSERT INTO historial_trazabilidad (id_lote, id_usuario_responsable, evento_descripcion)
VALUES (?, ?, ?);


-- ===========================================================================
-- SECCIÓN 6: Panel de Gestión de Lotes (Todos los Estados, para el Productor)
-- ===========================================================================

-- Vista de todos los lotes de un productor en cualquier estado, con conteo de
-- negociaciones activas por lote para el panel de control del productor.
CREATE OR REPLACE VIEW vw_lotes_productor AS
SELECT
    le.id_lote,
    le.id_productor,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido,
    le.fecha_cosecha,
    le.fecha_publicacion,
    le.estado_lote,
    (cp.vida_util_promedio_dias - DATEDIFF(CURDATE(), le.fecha_cosecha)) AS dias_restantes_vida_util,
    cp.id_producto,
    cp.nombre_producto,
    cat.nombre_categoria,
    -- Negociaciones pendientes de respuesta del productor para este lote
    (
        SELECT COUNT(*)
        FROM negociaciones_contraoferta n
        WHERE n.id_lote = le.id_lote
          AND n.estado_negociacion IN ('pendiente', 'contraoferta_productor')
    ) AS num_negociaciones_activas,
    -- Foto de portada para reconocimiento visual rápido en la lista
    f.url_archivo AS url_primera_foto
FROM lotes_excedentes le
JOIN catalogo_productos cp    ON le.id_producto  = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
LEFT JOIN (
    SELECT id_lote, MIN(url_archivo) AS url_archivo
    FROM evidencias_fotograficas
    GROUP BY id_lote
) f ON le.id_lote = f.id_lote;

-- Obtener todos los lotes de un productor (panel de gestión completo)
SELECT * FROM vw_lotes_productor
WHERE id_productor = ?
ORDER BY fecha_publicacion DESC;

-- Obtener solo los lotes disponibles de un productor, ordenados por urgencia de caducidad
SELECT * FROM vw_lotes_productor
WHERE id_productor = ? AND estado_lote = 'disponible'
ORDER BY dias_restantes_vida_util ASC;

-- Cambiar el estado de un lote (p. ej. retirar del mercado)
-- La condición AND id_productor asegura que solo el dueño puede modificar el lote
UPDATE lotes_excedentes
SET estado_lote = ?
WHERE id_lote = ? AND id_productor = ?;


-- ===========================================================================
-- SECCIÓN 7: Triggers y Automatizaciones
-- ===========================================================================

-- Trigger: Registrar automáticamente en trazabilidad cuando cambia el estado de un lote.
-- Garantiza un log de auditoría sin depender del código de aplicación.
DELIMITER //
CREATE TRIGGER trg_trazabilidad_cambio_estado
AFTER UPDATE ON lotes_excedentes
FOR EACH ROW
BEGIN
    IF OLD.estado_lote <> NEW.estado_lote THEN
        INSERT INTO historial_trazabilidad (id_lote, id_usuario_responsable, evento_descripcion)
        VALUES (
            NEW.id_lote,
            NEW.id_productor,
            CONCAT('Estado del lote cambió de "', OLD.estado_lote, '" a "', NEW.estado_lote, '"')
        );
    END IF;
END //
DELIMITER ;

-- SUGERENCIA: Evento programado para marcar como 'caducado' los lotes que ya superaron
-- su vida útil. Requiere activar el programador de eventos del servidor:
--   SET GLOBAL event_scheduler = ON;
--
-- CREATE EVENT IF NOT EXISTS evt_caducar_lotes_vencidos
-- ON SCHEDULE EVERY 1 DAY STARTS CURRENT_TIMESTAMP
-- DO
-- BEGIN
--     UPDATE lotes_excedentes le
--     JOIN catalogo_productos cp ON le.id_producto = cp.id_producto
--     SET le.estado_lote = 'caducado'
--     WHERE le.estado_lote = 'disponible'
--       AND DATEDIFF(CURDATE(), le.fecha_cosecha) > cp.vida_util_promedio_dias;
-- END;


-- ===========================================================================
-- SUGERENCIA: Módulo de Negociaciones
-- Las consultas de flujo de negociación (crear negociación, hacer contraoferta,
-- aceptar/rechazar, verificación QR de entrega) deberían ir en un archivo
-- separado: querys/Alan/negociaciones.sql
-- ===========================================================================

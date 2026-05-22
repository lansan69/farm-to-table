-- ===========================================================================
-- Módulo: Usuarios, Autenticación y Perfiles
-- Descripción: Vistas y consultas para autenticación, registro de nuevos
--              usuarios, perfiles de comprador (organización) y productor,
--              chat de negociación y sistema de reputación por valoraciones.
-- ===========================================================================


-- ===========================================================================
-- SECCIÓN 0: Modificaciones al Esquema — Ejecutar una sola vez
-- Agrega campos necesarios para la lógica de perfiles y reputación.
-- Estas sentencias fallarán si ya fueron ejecutadas previamente, lo cual es normal.
-- ===========================================================================

-- Agregar campo de reputación promedio al perfil de cada usuario.
-- Se actualiza automáticamente con los triggers de la Sección 8.
ALTER TABLE usuarios
ADD COLUMN puntuacion_promedio DECIMAL(3,2) DEFAULT 0.00
    CHECK (puntuacion_promedio >= 0.00 AND puntuacion_promedio <= 5.00);

-- SUGERENCIA: Para el módulo de chat (ver Sección 3), agregar la siguiente tabla.
-- El chat está vinculado a una negociación específica, no a usuarios en general.
--
-- CREATE TABLE mensajes_chat (
--     id_mensaje        INT NOT NULL AUTO_INCREMENT,
--     id_negociacion    INT NOT NULL,
--     id_usuario_emisor INT NOT NULL,
--     contenido         TEXT NOT NULL,
--     tipo_mensaje      ENUM('texto', 'imagen', 'oferta') DEFAULT 'texto',
--     fecha_envio       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     leido             TINYINT(1) DEFAULT 0,
--     PRIMARY KEY (id_mensaje),
--     FOREIGN KEY (id_negociacion)    REFERENCES negociaciones_contraoferta(id_negociacion) ON DELETE CASCADE,
--     FOREIGN KEY (id_usuario_emisor) REFERENCES usuarios(id_usuario)
-- );


-- ===========================================================================
-- SECCIÓN 1: Autenticación — Inicio de Sesión
-- ===========================================================================

-- Verificar si existe un usuario con ese número de teléfono (paso previo al login,
-- para determinar si mostrar el campo de contraseña o el de registro)
SELECT id_usuario, rol_usuario, hash_contrasena
FROM usuarios
WHERE telefono_contacto = ?;

-- Verificar credenciales completas: teléfono + hash de contraseña
-- Devuelve el id y rol para construir la sesión
SELECT id_usuario, nombre_razon_social, rol_usuario
FROM usuarios
WHERE telefono_contacto = ? AND hash_contrasena = ?;


-- ===========================================================================
-- SECCIÓN 2: Autenticación — Registro de Nuevo Usuario
-- ===========================================================================

-- Verificar que no exista ya un usuario con el mismo número de teléfono
SELECT COUNT(*) AS existe
FROM usuarios
WHERE telefono_contacto = ?;

-- Obtener zonas operativas activas para el selector del formulario de registro
SELECT id_zona, nombre_delegacion, codigo_postal
FROM zonas_operativas
WHERE activa = TRUE
ORDER BY nombre_delegacion;

-- Registrar un nuevo usuario
-- Parámetros: id_zona, nombre_razon_social, rol_usuario ('productor' | 'organizacion'),
--             telefono_contacto, hash_contrasena
INSERT INTO usuarios (id_zona, nombre_razon_social, rol_usuario, telefono_contacto, hash_contrasena)
VALUES (?, ?, ?, ?, ?);


-- ===========================================================================
-- SECCIÓN 3: Chat — Consultas pendientes de implementación
-- NOTA: Requiere crear la tabla mensajes_chat (ver Sección 0)
-- ===========================================================================

-- Cargar el historial del chat de una negociación en orden cronológico
-- SELECT
--     mc.id_mensaje,
--     mc.contenido,
--     mc.tipo_mensaje,
--     mc.fecha_envio,
--     mc.leido,
--     u.id_usuario           AS id_emisor,
--     u.nombre_razon_social  AS nombre_emisor
-- FROM mensajes_chat mc
-- JOIN usuarios u ON mc.id_usuario_emisor = u.id_usuario
-- WHERE mc.id_negociacion = ?
-- ORDER BY mc.fecha_envio ASC;

-- Enviar un nuevo mensaje en el chat de una negociación
-- Parámetros: id_negociacion, id_usuario_emisor, contenido, tipo_mensaje
-- INSERT INTO mensajes_chat (id_negociacion, id_usuario_emisor, contenido, tipo_mensaje)
-- VALUES (?, ?, ?, ?);

-- Marcar como leídos los mensajes de la contraparte (llamar al abrir el chat)
-- Parámetros: id_negociacion, id_usuario_que_lee
-- UPDATE mensajes_chat
-- SET leido = 1
-- WHERE id_negociacion = ? AND id_usuario_emisor != ? AND leido = 0;

-- Contar mensajes no leídos en todas las negociaciones de un usuario (badge de notificaciones)
-- Parámetros: id_usuario_receptor
-- SELECT mc.id_negociacion, COUNT(*) AS mensajes_sin_leer
-- FROM mensajes_chat mc
-- JOIN negociaciones_contraoferta n ON mc.id_negociacion = n.id_negociacion
-- WHERE (n.id_comprador = ? OR EXISTS (
--     SELECT 1 FROM lotes_excedentes le WHERE le.id_lote = n.id_lote AND le.id_productor = ?
-- ))
-- AND mc.id_usuario_emisor != ?
-- AND mc.leido = 0
-- GROUP BY mc.id_negociacion;


-- ===========================================================================
-- SECCIÓN 4: Vista Base de Usuarios con Ubicación
-- Base para las consultas de perfil de comprador y productor
-- ===========================================================================

-- Vista general de usuarios con su zona operativa y reputación.
-- No filtra por rol; aplicar el filtro de rol en cada consulta según el contexto.
CREATE OR REPLACE VIEW vw_usuarios_ubicacion AS
SELECT
    u.id_usuario,
    u.nombre_razon_social,
    u.rol_usuario,
    u.telefono_contacto,
    u.fecha_registro,
    u.puntuacion_promedio,
    z.id_zona,
    z.nombre_delegacion,
    z.codigo_postal
FROM usuarios u
JOIN zonas_operativas z ON u.id_zona = z.id_zona;

-- Obtener datos básicos de cualquier usuario por ID
SELECT * FROM vw_usuarios_ubicacion WHERE id_usuario = ?;

-- Actualizar datos editables del perfil de un usuario
-- Parámetros: nombre_razon_social, telefono_contacto, id_zona, id_usuario
UPDATE usuarios
SET nombre_razon_social = ?,
    telefono_contacto   = ?,
    id_zona             = ?
WHERE id_usuario = ?;


-- ===========================================================================
-- SECCIÓN 5: Perfil de Comprador (rol: 'organizacion')
-- ===========================================================================

-- Obtener el perfil básico de un comprador por su ID
-- NOTA: el rol en la BD es 'organizacion', no 'comprador'
SELECT * FROM vw_usuarios_ubicacion
WHERE id_usuario = ? AND rol_usuario = 'organizacion';

-- Vista de historial de transacciones, reutilizada para compradores y productores.
-- Usa subconsulta para traer únicamente la ÚLTIMA oferta por negociación,
-- evitando filas duplicadas cuando hay múltiples rondas de contraoferta.
CREATE OR REPLACE VIEW vw_info_compra_venta AS
SELECT
    n.id_negociacion,
    n.estado_negociacion,
    n.fecha_creacion AS fecha_inicio_negociacion,
    -- Lote
    le.id_lote,
    le.cantidad_kg,
    -- Producto
    cp.id_producto,
    cp.nombre_producto,
    -- Comprador (organización)
    comp.id_usuario           AS id_comprador,
    comp.nombre_razon_social  AS nombre_comprador,
    -- Productor (dueño del lote)
    prod.id_usuario           AS id_productor,
    prod.nombre_razon_social  AS nombre_productor,
    -- Precio y emisor de la última oferta presentada en la negociación
    ultima_oferta.monto_propuesto    AS precio_ultima_oferta,
    ultima_oferta.id_usuario_emisor  AS id_emisor_ultima_oferta,
    -- Entrega
    e.id_entrega,
    e.estado_entrega,
    e.fecha_estimada_entrega,
    e.fecha_recepcion_real,
    e.codigo_verificacion_qr
FROM negociaciones_contraoferta n
JOIN lotes_excedentes le         ON n.id_lote        = le.id_lote
JOIN catalogo_productos cp       ON le.id_producto   = cp.id_producto
JOIN usuarios comp               ON n.id_comprador   = comp.id_usuario
JOIN usuarios prod               ON le.id_productor  = prod.id_usuario
LEFT JOIN entregas_logistica e   ON n.id_negociacion = e.id_negociacion
LEFT JOIN (
    -- Solo la oferta más reciente por negociación para garantizar una fila por negociación
    SELECT d1.id_negociacion, d1.monto_propuesto, d1.id_usuario_emisor
    FROM detalles_ofertas d1
    INNER JOIN (
        SELECT id_negociacion, MAX(fecha_envio) AS fecha_max
        FROM detalles_ofertas
        GROUP BY id_negociacion
    ) d2 ON d1.id_negociacion = d2.id_negociacion
        AND d1.fecha_envio    = d2.fecha_max
) ultima_oferta ON n.id_negociacion = ultima_oferta.id_negociacion;

-- Las 5 compras más recientes de un comprador (negociaciones ya aceptadas)
SELECT
    id_negociacion,
    id_lote,
    nombre_producto,
    cantidad_kg,
    precio_ultima_oferta,
    id_productor,
    nombre_productor,
    fecha_inicio_negociacion,
    estado_entrega
FROM vw_info_compra_venta
WHERE id_comprador = ? AND estado_negociacion = 'aceptada'
ORDER BY fecha_inicio_negociacion DESC
LIMIT 5;

-- Historial completo de compras de un comprador (todos los estados)
SELECT
    id_negociacion,
    nombre_producto,
    cantidad_kg,
    precio_ultima_oferta,
    nombre_productor,
    estado_negociacion,
    estado_entrega,
    fecha_inicio_negociacion,
    fecha_recepcion_real
FROM vw_info_compra_venta
WHERE id_comprador = ?
ORDER BY fecha_inicio_negociacion DESC;

-- Vista de estadísticas del comprador para el encabezado del perfil.
-- Usa subconsultas para evitar doble conteo al cruzar múltiples tablas.
CREATE OR REPLACE VIEW vw_stats_comprador AS
SELECT
    u.id_usuario,
    u.nombre_razon_social,
    u.puntuacion_promedio,
    (
        SELECT COUNT(*)
        FROM negociaciones_contraoferta
        WHERE id_comprador = u.id_usuario
    ) AS total_negociaciones,
    (
        SELECT COUNT(*)
        FROM negociaciones_contraoferta
        WHERE id_comprador = u.id_usuario AND estado_negociacion = 'aceptada'
    ) AS total_compras_completadas,
    (
        SELECT COALESCE(SUM(le2.cantidad_kg), 0)
        FROM entregas_logistica e2
        JOIN negociaciones_contraoferta n2 ON e2.id_negociacion = n2.id_negociacion
        JOIN lotes_excedentes le2          ON n2.id_lote        = le2.id_lote
        WHERE n2.id_comprador = u.id_usuario AND e2.estado_entrega = 'entregado'
    ) AS total_kg_recibidos
FROM usuarios u
WHERE u.rol_usuario = 'organizacion';

-- Obtener estadísticas de un comprador específico
SELECT * FROM vw_stats_comprador WHERE id_usuario = ?;


-- ===========================================================================
-- SECCIÓN 6: Perfil de Productor (rol: 'productor')
-- ===========================================================================

-- Obtener el perfil básico de un productor por su ID
SELECT * FROM vw_usuarios_ubicacion
WHERE id_usuario = ? AND rol_usuario = 'productor';

-- Las 5 ventas más recientes de un productor (negociaciones ya aceptadas)
SELECT
    id_negociacion,
    id_lote,
    nombre_producto,
    cantidad_kg,
    precio_ultima_oferta,
    id_comprador,
    nombre_comprador,
    fecha_inicio_negociacion,
    estado_entrega
FROM vw_info_compra_venta
WHERE id_productor = ? AND estado_negociacion = 'aceptada'
ORDER BY fecha_inicio_negociacion DESC
LIMIT 5;

-- Historial completo de ventas de un productor (todos los estados)
SELECT
    id_negociacion,
    nombre_producto,
    cantidad_kg,
    precio_ultima_oferta,
    nombre_comprador,
    estado_negociacion,
    estado_entrega,
    fecha_inicio_negociacion,
    fecha_recepcion_real
FROM vw_info_compra_venta
WHERE id_productor = ?
ORDER BY fecha_inicio_negociacion DESC;

-- Vista de estadísticas del productor para el encabezado del perfil.
-- Usa subconsultas para evitar doble conteo al cruzar múltiples tablas.
CREATE OR REPLACE VIEW vw_stats_productor AS
SELECT
    u.id_usuario,
    u.nombre_razon_social,
    u.puntuacion_promedio,
    (
        SELECT COUNT(*)
        FROM lotes_excedentes
        WHERE id_productor = u.id_usuario
    ) AS total_lotes_publicados,
    (
        SELECT COUNT(*)
        FROM lotes_excedentes
        WHERE id_productor = u.id_usuario AND estado_lote = 'asignado'
    ) AS total_lotes_asignados,
    (
        SELECT COUNT(DISTINCT n2.id_negociacion)
        FROM negociaciones_contraoferta n2
        JOIN lotes_excedentes le2 ON n2.id_lote = le2.id_lote
        WHERE le2.id_productor = u.id_usuario AND n2.estado_negociacion = 'aceptada'
    ) AS total_ventas_completadas,
    (
        SELECT COALESCE(SUM(le3.cantidad_kg), 0)
        FROM negociaciones_contraoferta n3
        JOIN lotes_excedentes le3 ON n3.id_lote = le3.id_lote
        WHERE le3.id_productor = u.id_usuario AND n3.estado_negociacion = 'aceptada'
    ) AS total_kg_vendidos
FROM usuarios u
WHERE u.rol_usuario = 'productor';

-- Obtener estadísticas de un productor específico
SELECT * FROM vw_stats_productor WHERE id_usuario = ?;


-- ===========================================================================
-- SECCIÓN 7: Valoraciones y Reseñas
-- ===========================================================================

-- Registrar una nueva valoración al finalizar una entrega
-- Parámetros: id_entrega, id_usuario_evaluador, id_usuario_evaluado,
--             calificacion_estrellas (1-5), comentarios
INSERT INTO valoraciones_reputacion (id_entrega, id_usuario_evaluador, id_usuario_evaluado, calificacion_estrellas, comentarios)
VALUES (?, ?, ?, ?, ?);

-- Obtener todas las valoraciones recibidas por un usuario (para su sección de reseñas)
SELECT
    vr.calificacion_estrellas,
    vr.comentarios,
    vr.fecha_valoracion,
    u.nombre_razon_social   AS evaluador,
    cp.nombre_producto,
    e.fecha_recepcion_real  AS fecha_entrega
FROM valoraciones_reputacion vr
JOIN usuarios u                    ON vr.id_usuario_evaluador = u.id_usuario
JOIN entregas_logistica e          ON vr.id_entrega           = e.id_entrega
JOIN negociaciones_contraoferta n  ON e.id_negociacion        = n.id_negociacion
JOIN lotes_excedentes le           ON n.id_lote               = le.id_lote
JOIN catalogo_productos cp         ON le.id_producto          = cp.id_producto
WHERE vr.id_usuario_evaluado = ?
ORDER BY vr.fecha_valoracion DESC;

-- Calcular el promedio de calificaciones de un usuario (consulta directa, sin trigger)
SELECT
    AVG(calificacion_estrellas)  AS promedio,
    COUNT(*)                     AS total_valoraciones
FROM valoraciones_reputacion
WHERE id_usuario_evaluado = ?;


-- ===========================================================================
-- SECCIÓN 8: Triggers de Reputación
-- Mantienen sincronizado el campo puntuacion_promedio en la tabla usuarios
-- ===========================================================================

-- Eliminar el trigger original si existe, ya que se reemplaza por versiones nombradas
DROP TRIGGER IF EXISTS trg_actualizar_reputacion;

-- Trigger: Recalcular promedio al insertar una nueva valoración
DELIMITER //
CREATE TRIGGER trg_actualizar_reputacion_insert
AFTER INSERT ON valoraciones_reputacion
FOR EACH ROW
BEGIN
    UPDATE usuarios
    SET puntuacion_promedio = (
        SELECT AVG(calificacion_estrellas)
        FROM valoraciones_reputacion
        WHERE id_usuario_evaluado = NEW.id_usuario_evaluado
    )
    WHERE id_usuario = NEW.id_usuario_evaluado;
END //
DELIMITER ;

-- Trigger: Recalcular promedio si se edita una valoración existente
DELIMITER //
CREATE TRIGGER trg_actualizar_reputacion_update
AFTER UPDATE ON valoraciones_reputacion
FOR EACH ROW
BEGIN
    UPDATE usuarios
    SET puntuacion_promedio = (
        SELECT AVG(calificacion_estrellas)
        FROM valoraciones_reputacion
        WHERE id_usuario_evaluado = NEW.id_usuario_evaluado
    )
    WHERE id_usuario = NEW.id_usuario_evaluado;
END //
DELIMITER ;

-- Trigger: Recalcular promedio si se elimina una valoración
-- Usa AFTER DELETE: la fila ya fue removida, por lo que el AVG excluye la eliminada
DELIMITER //
CREATE TRIGGER trg_actualizar_reputacion_delete
AFTER DELETE ON valoraciones_reputacion
FOR EACH ROW
BEGIN
    UPDATE usuarios
    SET puntuacion_promedio = COALESCE((
        SELECT AVG(calificacion_estrellas)
        FROM valoraciones_reputacion
        WHERE id_usuario_evaluado = OLD.id_usuario_evaluado
    ), 0.00)
    WHERE id_usuario = OLD.id_usuario_evaluado;
END //
DELIMITER ;

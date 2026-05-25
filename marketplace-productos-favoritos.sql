-- ==========================================================
-- Nombre: Juan Ochoa 
-- Fecha: 2026-05-24
-- MÓDULO: Marketplace
-- Descripción: Consultas para mostrar productos disponibles,
-- agregar favoritos, contactar al vendedor y ver detalle.
-- ==========================================================

-- ==========================================================
-- CONSULTA: Mostrar productos del marketplace
-- Sirve para llenar las cards donde aparecen el nombre del 
-- producto, precio, ubicación, vendedor e imagen.
--
-- Devuelve:
-- id_lote
-- nombre_producto
-- nombre_categoria
-- cantidad_kg
-- precio_recuperacion_sugerido
-- estado_lote
-- fecha_publicacion
-- nombre_vendedor
-- nombre_delegacion
-- codigo_postal
-- imagen_producto
-- ==========================================================
SELECT
    le.id_lote,
    cp.nombre_producto,
    cat.nombre_categoria,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido,
    le.estado_lote,
    le.fecha_publicacion,
    u.nombre_razon_social AS nombre_vendedor,
    z.nombre_delegacion,
    z.codigo_postal,
    ef.url_archivo AS imagen_producto
FROM lotes_excedentes le
JOIN catalogo_productos cp ON le.id_producto = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
JOIN usuarios u ON le.id_productor = u.id_usuario
JOIN zonas_operativas z ON u.id_zona = z.id_zona
LEFT JOIN evidencias_fotograficas ef ON le.id_lote = ef.id_lote
WHERE le.estado_lote = 'disponible';

-- ==========================================================
-- CONSULTA: Filtrar productos por categoría
-- Sirve para buscar productos mediante botones de categoría.
--
-- Devuelve:
-- id_lote
-- nombre_producto
-- nombre_categoria
-- cantidad_kg
-- precio_recuperacion_sugerido
-- ==========================================================
SELECT
    le.id_lote,
    cp.nombre_producto,
    cat.nombre_categoria,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido
FROM lotes_excedentes le
JOIN catalogo_productos cp ON le.id_producto = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
WHERE cat.nombre_categoria = 'Frutas'
ORDER BY le.fecha_publicacion DESC;

-- ==========================================================
-- CONSULTA: Buscar productos por nombre
-- Sirve para buscar productos mediante la barra de búsqueda.
--
-- Devuelve:
-- id_lote
-- nombre_producto
-- nombre_categoria
-- cantidad_kg
-- precio_recuperacion_sugerido
-- ==========================================================
SELECT
    le.id_lote,
    cp.nombre_producto,
    cat.nombre_categoria,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido
FROM lotes_excedentes le
JOIN catalogo_productos cp ON le.id_producto = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
WHERE cp.nombre_producto LIKE '%Manzana%'
ORDER BY le.fecha_publicacion DESC;

-- ==========================================================
-- CONSULTA: Vista individual del producto
-- Sirve para mostrar el detalle completo de un producto
-- cuando el usuario da clic en una card.
--
-- Devuelve:
-- id_lote
-- nombre_producto
-- nombre_categoria
-- cantidad_kg
-- precio_recuperacion_sugerido
-- fecha_cosecha
-- nombre_razon_social
-- telefono_contacto
-- nombre_delegacion
-- url_archivo
-- ==========================================================
SELECT
    le.id_lote,
    cp.nombre_producto,
    cat.nombre_categoria,
    le.cantidad_kg,
    le.precio_recuperacion_sugerido,
    le.fecha_cosecha,
    u.nombre_razon_social,
    u.telefono_contacto,
    z.nombre_delegacion,
    ef.url_archivo
FROM lotes_excedentes le
JOIN catalogo_productos cp ON le.id_producto = cp.id_producto
JOIN categorias_productos cat ON cp.id_categoria = cat.id_categoria
JOIN usuarios u ON le.id_productor = u.id_usuario
JOIN zonas_operativas z ON u.id_zona = z.id_zona
LEFT JOIN evidencias_fotograficas ef ON le.id_lote = ef.id_lote
-- El 3 da referencia al id_lote que se quiere mostrar
WHERE le.id_lote = 3;

-- ==========================================================
-- CONSULTA: Crear una negociación de contraoferta
-- Sirve para crear una negociación de contraoferta.
--
-- Devuelve:
-- id_negociacion
-- id_comprador
-- id_lote
-- estado_negociacion
-- ==========================================================
INSERT INTO negociaciones_contraoferta(
    id_comprador,
    id_lote,
    estado_negociacion
)
VALUES (2,3,'pendiente');

-- ==========================================================
-- Favoritos del Marketplace
-- Permite guardar lotes favoritos para acceso rápido.
-- ==========================================================

-- SUGERENCIA: Para el módulo de favoritos del Marketplace,
-- agregar la siguiente tabla.
--
-- Esta tabla permite que un usuario guarde productos/lotes
-- como favoritos para revisarlos posteriormente.
--
-- CREATE TABLE favoritos_marketplace (
--     id_favorito      INT NOT NULL AUTO_INCREMENT,
--     id_usuario       INT NOT NULL,
--     id_lote          INT NOT NULL,
--     fecha_agregado   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--
--     PRIMARY KEY (id_favorito),
--
--     FOREIGN KEY (id_usuario)
--         REFERENCES usuarios(id_usuario)
--         ON DELETE CASCADE,
--
--     FOREIGN KEY (id_lote)
--         REFERENCES lotes_excedentes(id_lote)
--         ON DELETE CASCADE
-- );



-- ==========================================================
-- CONSULTAS DEL MÓDULO FAVORITOS
-- ==========================================================

-- ==========================================================
-- CONSULTA: Agregar lote a favoritos
-- Sirve para guardar un lote en favoritos.
--
-- Inserta:
-- id_usuario
-- id_lote
-- ==========================================================
INSERT INTO favoritos_marketplace (
    id_usuario,
    id_lote
)
VALUES (
    2, -- Usuario
    3  -- Lote favorito
);

-- ==========================================================
-- CONSULTA: Eliminar lote de favoritos
-- Sirve para quitar un producto guardado.
--
-- Elimina:
-- id_usuario
-- id_lote
-- ==========================================================
DELETE FROM favoritos_marketplace
WHERE id_usuario = 2
AND id_lote = 3;

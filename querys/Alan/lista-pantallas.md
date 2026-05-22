# Lista de pantallas para generar consultas
1. Log in
2. Register
3. Chat
4. Perfil de compador
5. Perfil de productor
6. Navegador

# Recomendaciones de Gemini
## 1. Vistas Recomendadas (SQL Views)

Las vistas simplificarán las consultas complejas (JOINs) en pantallas principales.

* **`vw_lotes_navegador`**: Combina `lotes_excedentes`, `catalogo_productos`, `categorias_productos`, la primera imagen de `evidencias_fotograficas` y datos de zona del productor. Filtra solo lotes en estado 'disponible'.
* **`vw_perfil_reputacion`**: Calcula el promedio de `calificacion_estrellas` y cuenta el total de valoraciones por usuario desde `valoraciones_reputacion`.
* **`vw_resumen_negociaciones`**: Une `negociaciones_contraoferta`, el último mensaje/precio de `detalles_ofertas`, `entregas_logistica` y los nombres de comprador y productor.

## 2. Disparadores Recomendados (SQL Triggers)

Para automatizar la integridad y el registro de la aplicación.

* **`trg_crear_trazabilidad_lote`**: `AFTER INSERT` en `lotes_excedentes`. Inserta automáticamente el evento inicial en `historial_trazabilidad`.
* **`trg_actualizar_trazabilidad_lote`**: `AFTER UPDATE` en `lotes_excedentes`. Registra en `historial_trazabilidad` si el `estado_lote` cambia.
* **`trg_estado_negociacion_auto`**: `AFTER INSERT` en `detalles_ofertas`. Actualiza el `estado_negociacion` en la tabla `negociaciones_contraoferta` dependiendo de si el emisor es el productor (contraoferta) o si se aprueba el monto.
* **`trg_validar_valoracion`**: `BEFORE INSERT` en `valoraciones_reputacion`. Lanza un error si la entrega logística no tiene el estado 'entregado'.

## 3. Consultas por Pantalla (Consults)

**1. Log in**

* Obtener usuario: `SELECT id_usuario, rol_usuario, hash_contrasena FROM usuarios WHERE telefono_contacto = ?`

**2. Register**

* Cargar zonas: `SELECT id_zona, nombre_delegacion FROM zonas_operativas WHERE activa = TRUE`
* Insertar usuario: `INSERT INTO usuarios (id_zona, nombre_razon_social, rol_usuario, telefono_contacto, hash_contrasena) VALUES (...)`

**3. Chat (Negociación en curso)**

* Cargar historial: `SELECT monto_propuesto, comentario, fecha_envio, id_usuario_emisor FROM detalles_ofertas WHERE id_negociacion = ? ORDER BY fecha_envio ASC`
* Enviar mensaje/oferta: `INSERT INTO detalles_ofertas (id_negociacion, id_usuario_emisor, monto_propuesto, comentario) VALUES (...)`

**4. Perfil de comprador (Organización)**

* Obtener datos básicos e historial de reputación: `SELECT * FROM vw_perfil_reputacion WHERE id_usuario = ?`
* Historial de compras: `SELECT * FROM vw_resumen_negociaciones WHERE id_comprador = ?`
* Validar entregas con QR: `SELECT codigo_verificacion_qr FROM entregas_logistica WHERE id_negociacion = ?`

**5. Perfil de productor**

* Obtener estadísticas (promedio de estrellas): `SELECT * FROM vw_perfil_reputacion WHERE id_usuario = ?`
* Mis lotes activos: `SELECT * FROM lotes_excedentes WHERE id_productor = ? AND estado_lote = 'disponible'`
* Publicar nuevo lote: `INSERT INTO lotes_excedentes (...)`
* Subir foto del lote: `INSERT INTO evidencias_fotograficas (id_lote, url_archivo) VALUES (...)`

**6. Navegador**

* Cargar categorías para filtros: `SELECT id_categoria, nombre_categoria FROM categorias_productos`
* Buscar productos disponibles: `SELECT * FROM vw_lotes_navegador WHERE nombre_producto LIKE ? OR id_categoria = ?`
* Ver detalle completo de un lote seleccionado: `SELECT * FROM vw_lotes_navegador WHERE id_lote = ?`
-- Acciones y Triggers de Contraofertas
-- Autor: Nayeli Adriana Ruiz Salgado
-- Fecha: 2026-05-26

-- 1. Query para el Botón "Contraoferta" (Inserta un nuevo regateo)
-- INSERT INTO detalles_ofertas (id_usuario_emisor, id_negociacion, monto_propuesto, comentario, fecha_envio)
-- VALUES (id_usuario, id_negociacion, monto, 'Comentario opcional', NOW());

-- 2. Query para el Botón "Aceptar" (Cambia el estado de la negociación)
-- UPDATE negociaciones_contraoferta SET estado_negociacion = 'aceptada' WHERE id_negociacion = id;

-- 3. Query para el Botón "Rechazar" (Cambia el estado de la negociación)
-- UPDATE  negociaciones_contraoferta SET estado_negociacion = 'rechazada' WHERE id_negociacion = id;

-- 4. TRIGGER: Automatización de Logística tras Aceptar una oferta
-- Cada vez que una negociación pasa a 'aceptada', crea en automático la orden de entrega.
DELIMITER //

CREATE TRIGGER generar_logistica_tras_aceptar
AFTER UPDATE ON negociaciones_contraoferta
FOR EACH ROW
BEGIN
    IF NEW.estado_negociacion = 'aceptada' AND OLD.estado_negociacion <> 'aceptada' THEN
        INSERT INTO entregas_logistica (id_negociacion, estado_entrega, fecha_estimada_entrega)
        VALUES (NEW.id_negociacion, 'pendiente', DATE_ADD(CURDATE(), INTERVAL 3 DAY));
    END IF;
END //

DELIMITER ;
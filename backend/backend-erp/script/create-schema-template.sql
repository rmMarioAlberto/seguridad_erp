-- Active: 1774487646845@@aws-1-us-east-1.pooler.supabase.com@6543@postgres@public
--========================== 1. Crear un Grupo
-- 0. Crear un Usuario
INSERT INTO
    "usuarios" (
        "nombre_completo",
        "direccion",
        "telefono",
        "fecha_inicio",
        "username",
        "email",
        "password",
        "permisos_globales"
    )
VALUES (
        'Administrador Sistema',
        'Calle Principal 123',
        '555-0101',
        CURRENT_DATE,
        'admin123',
        'admin123@gmail.com',
        '123456',
        '{}'
    );

INSERT INTO
    "grupos" (
        "nombre",
        "descripcion",
        "creador_id",
        "creado_en"
    )
VALUES (
        'Grupo de Soporte IT 123',
        'Grupo encargado de resolver problemas técnicos',
        6, -- id-del-usuario-creador (ejemplo: 1)
        NOW()
    );

--====================== 2. Crear un Estado
INSERT INTO
    "estados" ("nombre", "color")
VALUES ('Abierto', '#00FF00');

INSERT INTO
    "estados" ("nombre", "color")
VALUES ('En Progreso', '#0055ff');

-- 3. Crear una Prioridad
INSERT INTO "prioridades" ("nombre", "orden") VALUES ('Alta', 1);

INSERT INTO "prioridades" ("nombre", "orden") VALUES ('baja', 1);

-- 4. Crear un Ticket
INSERT INTO
    "tickets" (
        "grupo_id",
        "titulo",
        "descripcion",
        "autor_id",
        "asignado_id",
        "estado_id",
        "prioridad_id",
        "creado_en"
    )
VALUES (
        1, -- id-del-grupo
        'Problema con el servidor',
        'El servidor principal no responde desde esta mañana.',
        1, -- id-del-autor
        1, -- id-del-asignado
        1, -- id-del-estado
        1, -- id-de-la-prioridad
        NOW()
    );

-- 3. Editar un Ticket (Ej. cambiar estado, prioridad y asignado)
UPDATE "tickets"
SET
    "estado_id" = 2, -- id-del-nuevo-estado
    "prioridad_id" = 2, -- id-de-la-nueva-prioridad
    "asignado_id" = 1, -- id-del-nuevo-asignado
    "descripcion" = 'El servidor principal no responde desde esta mañana (Actualizado: Revisando logs).'
WHERE
    "id" = 2;
-- id-del-ticket-a-editar
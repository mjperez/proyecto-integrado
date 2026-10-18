-- 0006 · US-A1 · baja lógica del catálogo de productos
-- La Tabla 14 no lista `activo` para producto, pero sin esta columna retirar un
-- producto obliga a DELETE: o falla por la FK de precios, o borra el histórico.
-- Es el mismo criterio que se aplicó a categorías en la 0004.
--
-- La unicidad (nombre, marca, formato, unidad) se mantiene sobre todas las
-- filas, activas e inactivas, para que los precios históricos sigan apuntando
-- al mismo id. Para "volver a dar de alta" un producto retirado se reactiva la
-- fila existente en lugar de crear otra.

alter table public.productos
  add column if not exists activo boolean not null default true;

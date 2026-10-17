-- 0001 · Limpieza del modelo legacy (TypeORM, Sprint 0)
-- Va PRIMERO: estas tablas ocupan los nombres `categorias` y `productos`,
-- que el esquema nuevo necesita. Si se ejecutara después, borraría las
-- tablas recién creadas.
--
-- Ninguna consulta de la aplicación usa estas tablas. Respaldo previo:
--   supabase db dump --data-only --schema public -f respaldo_legacy.sql

drop table if exists public.listados  cascade;
drop table if exists public.productos  cascade;
drop table if exists public.negocios   cascade;
drop table if exists public.categorias cascade;

drop type if exists public.productos_tipo_enum;

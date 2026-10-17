-- 0002 · Esquema base del Observatorio de Precios
-- Fuente de verdad: Tabla 14 del SDD (Fabres, Pérez, Rubio, 2026).
-- Nomenclatura: tablas en plural, columnas y claves foráneas en singular.

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- roles
create table if not exists public.roles (
  id_rol  integer generated always as identity primary key,
  nombre  varchar(30) not null unique,
  constraint roles_nombre_check
    check (nombre in ('vecino', 'comercio', 'terreno', 'administrador'))
);

-- ---------------------------------------------------------------- usuarios
create table if not exists public.usuarios (
  id_usuario      uuid primary key default gen_random_uuid(),
  nombre          varchar(120) not null,
  email           varchar(160) not null unique,
  auth_uid        uuid unique references auth.users (id) on delete set null,
  fecha_registro  timestamptz not null default now(),
  id_rol          integer not null references public.roles (id_rol)
);

-- ---------------------------------------------------------------- catálogo
create table if not exists public.categorias (
  id_categoria  integer generated always as identity primary key,
  nombre        varchar(100) not null unique,
  descripcion   text
);

create table if not exists public.alias_categorias (
  id_alias      integer generated always as identity primary key,
  alias         varchar(100) not null unique,
  id_categoria  integer not null
                references public.categorias (id_categoria) on delete cascade
);

create table if not exists public.productos (
  id_producto   integer generated always as identity primary key,
  nombre        varchar(120) not null,
  marca         varchar(80)  not null,
  formato       varchar(60)  not null,
  unidad        varchar(20)  not null,
  id_categoria  integer not null references public.categorias (id_categoria),
  unique (nombre, marca, formato, unidad)
);

-- ---------------------------------------------------------------- comercios
create table if not exists public.comercios (
  id_comercio  integer generated always as identity primary key,
  nombre       varchar(120) not null,
  direccion    varchar(200) not null,
  tipo         varchar(40)  not null,
  ubicacion    geography(Point, 4326) not null,
  activo       boolean not null default true,
  unique (nombre, direccion)
);
create index if not exists idx_comercios_ubic on public.comercios using gist (ubicacion);

-- ---------------------------------------------------------------- boletas
create table if not exists public.boletas (
  id_boleta    uuid primary key default gen_random_uuid(),
  id_comercio  integer not null references public.comercios (id_comercio),
  fecha        timestamptz not null default now(),
  imagen_url   text,
  raw_ocr      jsonb
);
create index if not exists idx_boletas_raw on public.boletas using gin (raw_ocr);

-- ---------------------------------------------------------------- precios
create table if not exists public.precios (
  id_precio       integer generated always as identity primary key,
  valor           numeric(10,2) not null check (valor >= 0),
  fecha_registro  timestamptz not null default now(),
  id_producto     integer not null references public.productos (id_producto),
  id_comercio     integer not null references public.comercios (id_comercio),
  id_boleta       uuid references public.boletas (id_boleta)
);
create index if not exists idx_precios_prod_com on public.precios (id_producto, id_comercio);
create index if not exists idx_precios_fecha    on public.precios (fecha_registro);

-- ---------------------------------------------------------------- auditoría
create table if not exists public.registros_auditoria (
  id_registro    integer generated always as identity primary key,
  id_usuario     uuid references public.usuarios (id_usuario),
  tabla          varchar(40) not null,
  accion         varchar(10) not null,
  registro_id    integer,
  fecha          timestamptz not null default now(),
  hash           char(64) not null,
  hash_anterior  integer references public.registros_auditoria (id_registro)
);

-- ---------------------------------------------------------------- vistas
-- security_invoker: la vista respeta el RLS de las tablas, no corre como dueño.
create or replace view public.v_comercios_mapa
with (security_invoker = true) as
select id_comercio,
       nombre,
       direccion,
       tipo,
       activo,
       st_y(ubicacion::geometry) as lat,
       st_x(ubicacion::geometry) as lng
from public.comercios
where activo = true;

create or replace view public.v_precio_actual
with (security_invoker = true) as
select distinct on (id_producto, id_comercio)
       id_precio, id_producto, id_comercio, valor, fecha_registro
from public.precios
order by id_producto, id_comercio, fecha_registro desc;

-- ---------------------------------------------------------------- funciones
-- Devuelve el slug del rol del usuario autenticado. SECURITY DEFINER para
-- poder leer usuarios/roles sin entrar en recursión de políticas.
create or replace function public.obtener_rol()
returns varchar
language sql stable security definer
set search_path = public, extensions
as $$
  select r.nombre
  from public.usuarios u
  join public.roles r on r.id_rol = u.id_rol
  where u.auth_uid = auth.uid();
$$;

-- Encadena cada cambio de precio con el hash anterior.
create or replace function public.fn_auditar_precio()
returns trigger
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_id_anterior   integer;
  v_hash_anterior char(64);
begin
  select id_registro, hash into v_id_anterior, v_hash_anterior
  from public.registros_auditoria
  order by id_registro desc
  limit 1;

  insert into public.registros_auditoria
    (id_usuario, tabla, accion, registro_id, hash, hash_anterior)
  values (
    (select id_usuario from public.usuarios where auth_uid = auth.uid()),
    'precios',
    tg_op,
    new.id_precio,
    encode(digest(new.id_precio::text || new.valor::text
                  || new.fecha_registro::text
                  || coalesce(v_hash_anterior, ''), 'sha256'), 'hex'),
    v_id_anterior
  );
  return new;
end $$;

drop trigger if exists trg_auditar_precio on public.precios;
create trigger trg_auditar_precio
  after insert or update on public.precios
  for each row execute function public.fn_auditar_precio();

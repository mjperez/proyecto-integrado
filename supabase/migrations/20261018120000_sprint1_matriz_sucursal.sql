-- 0005 · US-B1 · jerarquía matriz/sucursal, tipos de comercio y coordenadas
-- Criterio de aceptación (Tabla 4): UNIQUE(nombre,direccion); sucursal
-- vinculada a matriz; campo activo. La unicidad ya existe en 0002 y `activo`
-- en 0002. Esta migración cierra los dos que faltan.

-- ---------------------------------------------------------------- 1. jerarquía
-- Una matriz queda con id_matriz nulo; una sucursal apunta a su matriz.
alter table public.comercios
  add column if not exists id_matriz integer
    references public.comercios (id_comercio) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'comercio_no_es_su_matriz') then
    alter table public.comercios
      add constraint comercio_no_es_su_matriz
      check (id_matriz is null or id_matriz <> id_comercio);
  end if;
end $$;

create index if not exists idx_comercios_matriz on public.comercios (id_matriz);

-- Dos niveles como máximo. El CHECK de arriba solo impide la autorreferencia;
-- estas dos reglas impiden cadenas de tres o más niveles, que romperían el
-- agrupamiento de precios por matriz.
create or replace function public.fn_validar_jerarquia_comercio()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id_matriz is null then
    return new;
  end if;

  if exists (select 1 from public.comercios
             where id_comercio = new.id_matriz
               and id_matriz is not null) then
    raise exception 'la matriz indicada es a su vez sucursal: solo se permiten dos niveles'
      using errcode = 'P0001';
  end if;

  if exists (select 1 from public.comercios
             where id_matriz = new.id_comercio) then
    raise exception 'el comercio ya tiene sucursales: no puede pasar a ser sucursal'
      using errcode = 'P0001';
  end if;

  return new;
end $$;

drop trigger if exists trg_validar_jerarquia_comercio on public.comercios;
create trigger trg_validar_jerarquia_comercio
  before insert or update of id_matriz on public.comercios
  for each row execute function public.fn_validar_jerarquia_comercio();

-- ---------------------------------------------------------------- 2. tipos
-- El tipo se cierra a la lista del alcance del observatorio (comercio
-- minorista, almacén de barrio, feria y microemprendimiento). Se normalizan
-- primero las variantes con tilde para que el CHECK no falle con datos viejos.
update public.comercios set tipo = 'almacen'     where tipo = 'almacén';
update public.comercios set tipo = 'feria_libre' where tipo = 'feria';

do $$
declare
  v_fuera text;
begin
  select string_agg(distinct tipo, ', ' order by tipo) into v_fuera
  from public.comercios
  where tipo not in ('almacen', 'minimarket', 'supermercado',
                     'feria_libre', 'panaderia', 'microemprendimiento');

  if v_fuera is not null then
    raise exception 'tipos de comercio fuera de la lista, corrígelos antes de aplicar el CHECK: %', v_fuera;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'comercios_tipo_check') then
    alter table public.comercios
      add constraint comercios_tipo_check
      check (tipo in ('almacen', 'minimarket', 'supermercado',
                      'feria_libre', 'panaderia', 'microemprendimiento'));
  end if;
end $$;

-- ---------------------------------------------------------------- 3. coordenadas
-- La tabla guarda geography(Point,4326), que PostgREST devuelve como EWKB en
-- hexadecimal. La vista expone lat/lng como números para poder precargar el
-- formulario de edición sin parsear WKB en el cliente.
create or replace view public.v_comercios_coordenadas
with (security_invoker = true) as
select id_comercio,
       nombre,
       direccion,
       tipo,
       activo,
       id_matriz,
       st_y(ubicacion::geometry) as lat,
       st_x(ubicacion::geometry) as lng
from public.comercios;

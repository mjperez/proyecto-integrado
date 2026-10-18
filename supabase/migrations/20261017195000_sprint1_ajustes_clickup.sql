-- 0004 · Ajustes para cubrir los criterios de aceptación del Sprint 1

-- ------------------------------------------------ US-A3 · borrado lógico
alter table public.categorias
  add column if not exists activo boolean not null default true;

-- ------------------------------------------------ US-A2 · alias de producto
alter table public.alias_categorias
  alter column id_categoria drop not null;

alter table public.alias_categorias
  add column if not exists id_producto integer
    references public.productos (id_producto) on delete cascade;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'alias_un_solo_destino') then
    alter table public.alias_categorias
      add constraint alias_un_solo_destino
      check (num_nonnulls(id_categoria, id_producto) = 1);
  end if;
end $$;

-- el nombre ya no describe el contenido: ahora guarda alias de ambas cosas
alter table public.alias_categorias rename to aliases;

-- ------------------------------------------------ US-B1 / US-C1 · vínculo
create table if not exists public.usuarios_comercios (
  id_usuario  uuid    not null references public.usuarios (id_usuario) on delete cascade,
  id_comercio integer not null references public.comercios (id_comercio) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (id_usuario, id_comercio)
);

alter table public.usuarios_comercios enable row level security;

-- ------------------------------------------------ US-C1 · vigencia
alter table public.precios
  add column if not exists vigente_desde date not null default current_date;

alter table public.precios
  add column if not exists vigente_hasta date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'precios_vigencia_coherente') then
    alter table public.precios
      add constraint precios_vigencia_coherente
      check (vigente_hasta is null or vigente_hasta >= vigente_desde);
  end if;

  if exists (select 1 from public.precios where valor <= 0) then
    raise exception 'hay precios con valor <= 0: corrígelos antes de aplicar el CHECK';
  end if;

  alter table public.precios drop constraint if exists precios_valor_check;
  alter table public.precios
    add constraint precios_valor_positivo check (valor > 0);
end $$;

create index if not exists idx_precios_vigencia
  on public.precios (id_producto, id_comercio, vigente_desde desc);

-- la vista ahora respeta la ventana de vigencia
create or replace view public.v_precio_actual
with (security_invoker = true) as
select distinct on (id_producto, id_comercio)
       id_precio, id_producto, id_comercio, valor, fecha_registro,
       vigente_desde, vigente_hasta
from public.precios
where vigente_hasta is null or vigente_hasta >= current_date
order by id_producto, id_comercio, vigente_desde desc, fecha_registro desc;

-- ------------------------------------------------ helpers y RLS
create or replace function public.mi_id_usuario()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select id_usuario from public.usuarios where auth_uid = auth.uid();
$$;

drop policy if exists ver_mis_comercios on public.usuarios_comercios;
create policy ver_mis_comercios on public.usuarios_comercios
  for select to authenticated
  using (id_usuario = public.mi_id_usuario()
         or public.obtener_rol() = 'administrador');

drop policy if exists admin_usuarios_comercios on public.usuarios_comercios;
create policy admin_usuarios_comercios on public.usuarios_comercios
  for all to authenticated
  using (public.obtener_rol() = 'administrador')
  with check (public.obtener_rol() = 'administrador');

-- la ingesta ahora exige que el comercio sea del usuario
drop policy if exists insertar_precio on public.precios;
create policy insertar_precio on public.precios
  for insert to authenticated
  with check (
    public.obtener_rol() in ('terreno', 'administrador')
    or (public.obtener_rol() = 'comercio'
        and exists (
          select 1 from public.usuarios_comercios uc
          where uc.id_usuario = public.mi_id_usuario()
            and uc.id_comercio = precios.id_comercio
        ))
  );

-- 0003 · RLS del Sprint 1
-- Regla general: lectura pública del catálogo y los precios, escritura por rol.
-- Sin política que autorice, la tabla deniega (deny by default).

alter table public.roles               enable row level security;
alter table public.usuarios            enable row level security;
alter table public.categorias          enable row level security;
alter table public.alias_categorias    enable row level security;
alter table public.productos           enable row level security;
alter table public.comercios           enable row level security;
alter table public.boletas             enable row level security;
alter table public.precios             enable row level security;
alter table public.registros_auditoria enable row level security;

-- ---------------------------------------------------------------- lectura pública
-- Cubre al usuario no registrado (anon) del mapa y del comparador.
drop policy if exists lectura_publica on public.roles;
create policy lectura_publica on public.roles
  for select using (true);

drop policy if exists lectura_publica on public.categorias;
create policy lectura_publica on public.categorias
  for select using (true);

drop policy if exists lectura_publica on public.alias_categorias;
create policy lectura_publica on public.alias_categorias
  for select using (true);

drop policy if exists lectura_publica on public.productos;
create policy lectura_publica on public.productos
  for select using (true);

drop policy if exists lectura_publica on public.comercios;
create policy lectura_publica on public.comercios
  for select using (true);

drop policy if exists lectura_publica on public.precios;
create policy lectura_publica on public.precios
  for select using (true);

-- ---------------------------------------------------------------- administración
-- US-A1, US-A2, US-A3, US-B1: solo el administrador DIDESE mantiene el catálogo.
drop policy if exists admin_categorias on public.categorias;
create policy admin_categorias on public.categorias
  for all to authenticated
  using (public.obtener_rol() = 'administrador')
  with check (public.obtener_rol() = 'administrador');

drop policy if exists admin_alias on public.alias_categorias;
create policy admin_alias on public.alias_categorias
  for all to authenticated
  using (public.obtener_rol() = 'administrador')
  with check (public.obtener_rol() = 'administrador');

drop policy if exists admin_productos on public.productos;
create policy admin_productos on public.productos
  for all to authenticated
  using (public.obtener_rol() = 'administrador')
  with check (public.obtener_rol() = 'administrador');

drop policy if exists admin_comercios on public.comercios;
create policy admin_comercios on public.comercios
  for all to authenticated
  using (public.obtener_rol() = 'administrador')
  with check (public.obtener_rol() = 'administrador');

-- ---------------------------------------------------------------- ingesta de precios
-- US-C1: solo comercio, terreno y administrador cargan precios.
-- Sin política de delete: el histórico no se borra, se corrige con otra fila.
drop policy if exists insertar_precio on public.precios;
create policy insertar_precio on public.precios
  for insert to authenticated
  with check (public.obtener_rol() in ('comercio', 'terreno', 'administrador'));

drop policy if exists actualizar_precio on public.precios;
create policy actualizar_precio on public.precios
  for update to authenticated
  using (public.obtener_rol() in ('terreno', 'administrador'))
  with check (public.obtener_rol() in ('terreno', 'administrador'));

-- ---------------------------------------------------------------- boletas
drop policy if exists insertar_boleta on public.boletas;
create policy insertar_boleta on public.boletas
  for insert to authenticated
  with check (public.obtener_rol() in ('comercio', 'terreno'));

drop policy if exists ver_boleta on public.boletas;
create policy ver_boleta on public.boletas
  for select to authenticated
  using (public.obtener_rol() in ('terreno', 'administrador'));

-- ---------------------------------------------------------------- usuarios
drop policy if exists ver_perfil on public.usuarios;
create policy ver_perfil on public.usuarios
  for select to authenticated
  using (auth_uid = auth.uid());

drop policy if exists editar_perfil on public.usuarios;
create policy editar_perfil on public.usuarios
  for update to authenticated
  using (auth_uid = auth.uid())
  with check (auth_uid = auth.uid());

drop policy if exists admin_usuarios on public.usuarios;
create policy admin_usuarios on public.usuarios
  for all to authenticated
  using (public.obtener_rol() = 'administrador')
  with check (public.obtener_rol() = 'administrador');

-- ---------------------------------------------------------------- auditoría
-- Solo lectura para el administrador. La escritura la hace el trigger,
-- que corre como SECURITY DEFINER y por eso no necesita política.
drop policy if exists admin_auditoria on public.registros_auditoria;
create policy admin_auditoria on public.registros_auditoria
  for select to authenticated
  using (public.obtener_rol() = 'administrador');

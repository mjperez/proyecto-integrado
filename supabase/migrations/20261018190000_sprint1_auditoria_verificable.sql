-- 0008 · US-F3 · cadena de auditoría verificable
-- Problema que corrige: el hash original se calculaba sobre
-- (id_precio, valor, fecha_registro, hash previo). El valor del precio no se
-- guarda en el registro de auditoría, así que la cadena no se podía verificar:
-- en cuanto un precio cambiaba, el hash viejo dejaba de ser reproducible.
--
-- Nuevo formato: el hash cubre solo metadatos que el propio registro conserva
-- (tabla, acción, registro_id, fecha, usuario y hash anterior). Eso hace la
-- cadena verificable en cualquier momento sin depender del valor histórico.
-- La limitación queda documentada: la cadena prueba quién, cuándo y sobre qué
-- registro, no cuál era el valor anterior, porque la Tabla 14 no tiene columna
-- para el payload.

-- ---------------------------------------------------------------- payload
-- Una sola definición del texto que se firma, para que el trigger y el
-- verificador no se desincronicen.
create or replace function public.fn_payload_auditoria(
  p_tabla        varchar,
  p_accion       varchar,
  p_registro_id  integer,
  p_fecha        timestamptz,
  p_id_usuario   uuid,
  p_hash_previo  char(64)
)
returns text
language sql immutable
as $$
  select p_tabla || '|' || p_accion || '|'
      || coalesce(p_registro_id::text, '') || '|'
      || to_char(p_fecha at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US') || '|'
      || coalesce(p_id_usuario::text, '') || '|'
      || coalesce(p_hash_previo, '');
$$;

-- ---------------------------------------------------------------- trigger
create or replace function public.fn_auditar_precio()
returns trigger
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_id_anterior   integer;
  v_hash_anterior char(64);
  v_id_usuario    uuid;
  v_fecha         timestamptz := now();
  v_hash          char(64);
begin
  select id_registro, hash into v_id_anterior, v_hash_anterior
  from public.registros_auditoria
  order by id_registro desc
  limit 1;

  select id_usuario into v_id_usuario
  from public.usuarios
  where auth_uid = auth.uid();

  v_hash := encode(digest(
    public.fn_payload_auditoria('precios', tg_op, new.id_precio, v_fecha,
                                v_id_usuario, v_hash_anterior),
    'sha256'), 'hex');

  insert into public.registros_auditoria
    (id_usuario, tabla, accion, registro_id, fecha, hash, hash_anterior)
  values
    (v_id_usuario, 'precios', tg_op, new.id_precio, v_fecha, v_hash, v_id_anterior);

  return new;
end $$;

-- ---------------------------------------------------------------- recálculo
-- Los eslabones existentes se recalculan en orden con el formato nuevo, porque
-- el anterior no era reproducible. No se borra ningún registro: se conservan
-- usuario, acción, registro y fecha originales.
do $$
declare
  r        record;
  v_prev   char(64) := null;
  v_prev_id integer := null;
  v_hash   char(64);
begin
  perform set_config('search_path', 'public, extensions', true);

  for r in
    select id_registro, id_usuario, tabla, accion, registro_id, fecha
    from public.registros_auditoria
    order by id_registro
  loop
    v_hash := encode(digest(
      public.fn_payload_auditoria(r.tabla, r.accion, r.registro_id, r.fecha,
                                  r.id_usuario, v_prev),
      'sha256'), 'hex');

    update public.registros_auditoria
       set hash = v_hash,
           hash_anterior = v_prev_id
     where id_registro = r.id_registro;

    v_prev := v_hash;
    v_prev_id := r.id_registro;
  end loop;
end $$;

-- ---------------------------------------------------------------- verificación
-- Devuelve los eslabones que rompen la cadena: o el puntero al registro
-- anterior no es el inmediatamente anterior, o el hash no coincide con el
-- recalculado. Sin filas devueltas, la cadena está íntegra.
-- SECURITY INVOKER a propósito: respeta el RLS de registros_auditoria, que solo
-- deja leer al administrador.
create or replace function public.fn_verificar_auditoria()
returns table (id_registro_roto integer, motivo text)
language sql stable
set search_path = public, extensions
as $$
  with cadena as (
    select a.id_registro,
           a.id_usuario,
           a.tabla,
           a.accion,
           a.registro_id,
           a.fecha,
           a.hash,
           a.hash_anterior,
           lag(a.id_registro) over (order by a.id_registro) as id_previo,
           lag(a.hash)        over (order by a.id_registro) as hash_previo
    from public.registros_auditoria a
  ),
  evaluado as (
    select c.*,
           encode(digest(
             public.fn_payload_auditoria(c.tabla, c.accion, c.registro_id, c.fecha,
                                         c.id_usuario, c.hash_previo),
             'sha256'), 'hex') as hash_esperado
    from cadena c
  )
  select e.id_registro,
         case
           when e.hash_anterior is distinct from e.id_previo
             then 'el puntero al registro anterior no es el inmediatamente previo'
           else 'el hash no coincide con el recalculado'
         end
  from evaluado e
  where e.hash_anterior is distinct from e.id_previo
     or e.hash is distinct from e.hash_esperado
  order by e.id_registro;
$$;

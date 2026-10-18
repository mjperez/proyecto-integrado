-- 0007 · US-A2 · alias únicos sin distinguir mayúsculas
-- El UNIQUE de la columna es sensible a mayúsculas: "Marraqueta" y "marraqueta"
-- entrarían como dos alias distintos, que es exactamente el error que la tabla
-- existe para evitar. El índice funcional lo cierra en la BD; la Server Action
-- además normaliza a minúsculas antes de escribir.
--
-- Si ya hubiera alias que colisionan al ignorar mayúsculas, la migración aborta
-- y los nombra, en vez de fallar con un error opaco del índice.

do $$
declare
  v_dups text;
begin
  select string_agg(alias, ', ' order by alias) into v_dups
  from (
    select lower(alias) as alias
    from public.aliases
    group by lower(alias)
    having count(*) > 1
  ) d;

  if v_dups is not null then
    raise exception 'hay alias repetidos al ignorar mayúsculas, unifícalos antes: %', v_dups;
  end if;
end $$;

create unique index if not exists alias_unico_sin_mayusculas
  on public.aliases (lower(alias));

-- 0023 · el comercio más barato cambia según el producto
-- El seed aplicaba un factor fijo por comercio: la feria tenía 0,92 y ganaba en
-- los diez productos. Un comparador donde siempre gana el mismo local no
-- muestra nada, y en la demo se ve raro que la feria sea la más barata en todo.
--
-- Ahora el factor depende del producto: la posición del comercio rota con el id
-- del producto, así que el más barato cambia de local. La brecha máxima entre
-- el primero y el último queda en 17,5%, que es un rango creíble para una
-- comuna.
--
-- Los valores siguen siendo sintéticos. Solo cambia cómo se reparten.

-- 1. Fuera los cortes históricos: se regeneran al final con los valores nuevos.
delete from public.precios
where vigente_desde = fecha_registro::date
  and fecha_registro::time = time '10:00';

-- 2. Precio vigente por producto y comercio.
--    El mínimo actual del producto se toma como precio de referencia, así el
--    nivel general de la canasta no se mueve.
with base as (
  select id_producto, min(valor) as valor_base
  from public.precios
  group by id_producto
),
nuevo as (
  select b.id_producto,
         c.id_comercio,
         round(
           (b.valor_base * (1 + 0.035 * ((c.id_comercio + b.id_producto) % 6))) / 10
         ) * 10 as valor
  from base b
  cross join public.comercios c
)
update public.precios pr
set valor = n.valor
from nuevo n
where pr.id_producto = n.id_producto
  and pr.id_comercio = n.id_comercio;

-- 3. Cortes históricos, con la misma deriva semanal de siempre.
insert into public.precios (valor, id_producto, id_comercio, fecha_registro, vigente_desde, origen)
select greatest(
         round((a.valor * (1 + 0.015 * s.semana * ((a.id_comercio % 3) - 1))) / 10) * 10,
         10
       ),
       a.id_producto,
       a.id_comercio,
       (current_date - (s.semana * 7))::timestamp + time '10:00',
       current_date - (s.semana * 7),
       'manual'
from (
  select distinct on (pr.id_producto, pr.id_comercio)
         pr.id_producto, pr.id_comercio, pr.valor
  from public.precios pr
  order by pr.id_producto, pr.id_comercio, pr.vigente_desde desc, pr.id_precio desc
) a
cross join generate_series(1, 8) as s(semana)
where not exists (
  select 1 from public.precios h
  where h.id_producto = a.id_producto
    and h.id_comercio = a.id_comercio
    and h.vigente_desde = current_date - (s.semana * 7)
);

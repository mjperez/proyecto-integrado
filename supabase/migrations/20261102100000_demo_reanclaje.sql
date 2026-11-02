-- 0019 · reanclaje de los datos de prueba a la fecha de la demo
-- La 0014 ancló los cortes al 27 de octubre, que era la fecha en que se cerró
-- el Sprint 2. Hoy los precios vigentes tienen seis días y el historial termina
-- en esa misma fecha, así que la demo mostraría datos viejos.
--
-- Se repite el procedimiento completo: borrar los cortes insertados por la
-- migración anterior, desplazar en bloque el conjunto base hasta hoy y volver
-- a generar los ocho cortes semanales contados desde la fecha de ejecución.
-- Sigue siendo datos de prueba: no hay precios reales en la base.

-- 1. Cortes insertados por las migraciones 0013 y 0015. Se reconocen porque su
--    fecha de registro cae exactamente a las 10:00 del día de vigencia; el
--    seed original usa `now()`, así que ninguna fila base coincide con ese par.
delete from public.precios
where vigente_desde = fecha_registro::date
  and fecha_registro::time = time '10:00';

-- 2. Desplazamiento del conjunto base hasta la fecha de ejecución.
with delta as (
  select greatest((current_date - max(vigente_desde))::integer, 0) as dias
  from public.precios
)
update public.precios pr
set vigente_desde  = pr.vigente_desde + d.dias,
    fecha_registro = pr.fecha_registro + make_interval(days => d.dias)
from delta d
where d.dias > 0;

-- 3. Cortes históricos, contados desde el precio más nuevo.
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

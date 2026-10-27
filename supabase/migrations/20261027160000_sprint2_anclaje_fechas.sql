-- 0014 · US-D1/US-D2 · anclaje de los datos de prueba a la fecha de ejecución
-- La migración 0013 insertó los cortes históricos contados desde `current_date`.
-- El seed se había corrido el 18 de octubre, así que el corte de la semana 1
-- (20 de octubre) quedó más nuevo que los precios "vigentes" (18 de octubre) y
-- el comparador empezó a mostrar el corte histórico como precio actual.
--
-- Esta migración corrige las dos cosas de una vez:
--   1. borra los cortes mal anclados,
--   2. desplaza todo el conjunto de prueba el número de días que falte para que
--      el precio más nuevo quede en la fecha de ejecución,
--   3. vuelve a insertar los cortes, ahora contados desde el precio más nuevo.
--
-- Desplazar en bloque y no reescribir los valores conserva la forma de la serie
-- y deja el comparador mostrando precios de hoy, que es lo que se va a ver en la
-- demo. Sigue siendo datos de prueba: no hay precios reales en la base.

-- 1. Cortes insertados por 0013. Se identifican porque su fecha de registro cae
--    exactamente a las 10:00 del día de vigencia; el seed usa `now()`, así que
--    ninguna fila original coincide con ese par.
delete from public.precios
where vigente_desde = fecha_registro::date
  and fecha_registro::time = time '10:00';

-- 2. Desplazamiento del conjunto completo.
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

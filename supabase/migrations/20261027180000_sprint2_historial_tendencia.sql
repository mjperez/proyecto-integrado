-- 0018 · US-D2 · tendencia visible en la serie de prueba
-- La primera generación de cortes usaba una deriva que cambiaba de signo según
-- el id del comercio (-1,5%, 0 y +1,5% por semana). Como hay seis comercios y
-- los signos se reparten en partes iguales, la deriva se cancelaba en el
-- promedio y la serie quedaba plana: servía para probar el cálculo, no para
-- mostrar una tendencia.
--
-- Esta migración reemplaza los cortes por otros con una tendencia común por
-- producto (los pares suben, los impares bajan) y una dispersión por comercio
-- que se mantiene. El promedio se mueve, que es lo que la historia pide
-- detectar, y la banda entre mínimo y máximo sigue mostrando la diferencia
-- entre comercios.
--
-- Sigue siendo datos de prueba y la operación es idempotente: borra los cortes
-- anteriores por su marca (registro a las 10:00 del día de vigencia) y los
-- vuelve a generar.

delete from public.precios
where vigente_desde = fecha_registro::date
  and fecha_registro::time = time '10:00';

insert into public.precios (valor, id_producto, id_comercio, fecha_registro, vigente_desde, origen)
select greatest(
         round((
           a.valor * (
             1 - 0.012 * s.semana
                 * (case when a.id_producto % 2 = 0 then 1 else -1 end)
                 * (1 + 0.3 * ((a.id_comercio % 3) - 1))
           )
         ) / 10) * 10,
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

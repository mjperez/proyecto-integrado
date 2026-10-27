-- 0015 · US-D2 · la serie muestra el precio vigente por comercio, no solo el declarado
-- La primera definición de la vista promediaba únicamente los precios registrados
-- ese día. Como los comercios no declaran todos el mismo día, el promedio salta
-- según cuántos declararon: el 20 de octubre promediaba seis comercios y el 24,
-- uno solo, y la línea parecía un error de carga.
--
-- La serie correcta es la del precio que estaba vigente en cada comercio en cada
-- fecha. Se calcula con la ventana de vigencia de cada precio: un precio manda
-- desde su fecha de registro hasta que ese mismo comercio publica el siguiente.
-- Con eso todos los puntos se calculan sobre los mismos comercios y la tendencia
-- refleja el mercado, no el calendario de la fiscalización.

create or replace view public.v_historial_precio
with (security_invoker = true) as
with tramos as (
  select pr.id_producto,
         pr.id_comercio,
         pr.valor,
         pr.fecha_registro::date as desde,
         lead(pr.fecha_registro::date)
           over (partition by pr.id_producto, pr.id_comercio
                 order by pr.fecha_registro, pr.id_precio) as hasta
  from public.precios pr
  where pr.validado
    and pr.valor > 0
),
fechas as (
  select distinct desde as fecha from tramos
)
select t.id_producto,
       f.fecha,
       min(t.valor)                           as minimo,
       round(avg(t.valor), 2)                 as promedio,
       max(t.valor)                           as maximo,
       count(distinct t.id_comercio)::integer as comercios
from fechas f
join tramos t
  on t.desde <= f.fecha
 and (t.hasta is null or t.hasta > f.fecha)
group by t.id_producto, f.fecha;

comment on view public.v_historial_precio is
  'US-D2. Serie diaria por producto con el precio vigente de cada comercio: mínimo, promedio, máximo y cantidad de comercios.';

create index if not exists idx_precios_producto_fecha
  on public.precios (id_producto, fecha_registro);

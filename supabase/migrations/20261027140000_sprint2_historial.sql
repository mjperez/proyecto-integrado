-- 0012 · US-D2 · serie de precios por producto
-- El historial que pide la historia es una serie temporal por producto. La vista
-- agrega por día: mínimo, promedio y máximo entre los comercios que registraron
-- ese producto, más cuántos comercios aportaron. Agregar por día evita que la
-- gráfica dependa de cuántos comercios haya en cada fecha.
--
-- Solo precios validados, igual que el comparador: lo que no se publica tampoco
-- se grafica.

create or replace view public.v_historial_precio
with (security_invoker = true) as
select pr.id_producto,
       pr.fecha_registro::date                as fecha,
       min(pr.valor)                          as minimo,
       round(avg(pr.valor), 2)                as promedio,
       max(pr.valor)                          as maximo,
       count(distinct pr.id_comercio)::integer as comercios
from public.precios pr
where pr.validado
  and pr.valor > 0
group by pr.id_producto, pr.fecha_registro::date;

comment on view public.v_historial_precio is
  'US-D2. Serie diaria por producto: mínimo, promedio, máximo y cantidad de comercios.';

create index if not exists idx_precios_producto_fecha
  on public.precios (id_producto, fecha_registro);

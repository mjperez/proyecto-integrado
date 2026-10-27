-- 0011 · US-D1 · función del comparador comunal
-- El comparador del Sprint 1 leía la tabla `precios` completa: devolvía una fila
-- por precio histórico, así que un mismo comercio aparecía varias veces, y no
-- calculaba distancia. Esta función resuelve las tres cosas en una sola consulta:
-- un precio vigente y validado por comercio, la distancia desde un punto de
-- referencia y el orden por valor.
--
-- La referencia es el punto del vecino cuando llega (p_lat / p_lng) y, si no
-- llega, el centroide de los comercios activos con coordenadas. Así el
-- comparador funciona sin pedir geolocalización y sin hardcodear un centro.

create or replace function public.fn_comparador(
  p_producto integer,
  p_lat      double precision default null,
  p_lng      double precision default null
)
returns table (
  id_comercio    integer,
  comercio       text,
  direccion      text,
  tipo           text,
  valor          numeric,
  fecha_registro timestamptz,
  origen         text,
  distancia_m    double precision,
  ref_lat        double precision,
  ref_lng        double precision,
  ref_origen     text
)
language sql
stable
security invoker
set search_path = public
as $$
  with referencia as (
    select coalesce(p_lat, avg(c.lat))::double precision as lat,
           coalesce(p_lng, avg(c.lng))::double precision as lng,
           case
             when p_lat is null or p_lng is null then 'comuna'
             else 'usuario'
           end as origen
    from public.v_comercios_coordenadas c
    where c.activo
  ),
  -- Un solo precio por comercio: el vigente de mayor vigente_desde.
  -- `validado` participa del distinct para que un precio sin validar no tape
  -- al último precio bueno del mismo comercio.
  vigente as (
    select distinct on (pr.id_comercio)
           pr.id_comercio, pr.valor, pr.fecha_registro, pr.origen
    from public.precios pr
    where pr.id_producto = p_producto
      and pr.validado
      and pr.valor > 0
      and (pr.vigente_hasta is null or pr.vigente_hasta >= current_date)
    order by pr.id_comercio,
             pr.vigente_desde desc,
             pr.fecha_registro desc,
             pr.id_precio desc
  )
  select c.id_comercio,
         c.nombre,
         c.direccion,
         c.tipo,
         v.valor,
         v.fecha_registro,
         v.origen,
         case
           when c.lat is null or r.lat is null then null
           else st_distance(
                  st_setsrid(st_makepoint(c.lng, c.lat), 4326)::geography,
                  st_setsrid(st_makepoint(r.lng, r.lat), 4326)::geography
                )::double precision
         end as distancia_m,
         r.lat,
         r.lng,
         r.origen
  from vigente v
  join public.v_comercios_coordenadas c on c.id_comercio = v.id_comercio
  cross join referencia r
  where c.activo
  order by v.valor asc, distancia_m asc nulls last, c.nombre asc;
$$;

comment on function public.fn_comparador(integer, double precision, double precision) is
  'US-D1. Precio vigente y validado por comercio, con distancia al punto del vecino o al centroide comunal.';

-- security invoker: la RLS de precios y comercios se aplica igual, así que el
-- usuario no registrado solo ve lo que las políticas de lectura pública permiten.
grant execute on function public.fn_comparador(integer, double precision, double precision)
  to anon, authenticated;

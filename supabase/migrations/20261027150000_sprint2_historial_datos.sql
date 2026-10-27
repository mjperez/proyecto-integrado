-- 0013 · US-D2 · cortes históricos para la serie
-- Carga única de datos de prueba: ocho cortes semanales hacia atrás por producto
-- y comercio, derivados del precio vigente con una deriva fija según el id del
-- comercio (-1,5%, 0 y +1,5% semanal). Sin esto el historial tendría un solo
-- punto por producto y la gráfica de tendencia no se podría mostrar ni evaluar.
--
-- Va como migración y no como seed porque el seed del proyecto solo corre en un
-- `db reset` local; los cortes tienen que existir también en la base remota que
-- se usa para la demo. Es idempotente por producto, comercio y semana: si los
-- cortes ya existen no inserta nada.
--
-- Los valores son sintéticos, igual que el resto de los datos de prueba.

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

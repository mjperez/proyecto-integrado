-- 0010 · US-D1 · origen y validación del precio
-- El criterio de aceptación del comparador exige mostrar "solo precios vigentes
-- y validados". La vigencia ya estaba modelada (vigente_desde / vigente_hasta);
-- la validación no tenía representación en el esquema.
--
-- `origen` identifica por qué vía entró el dato y `validado` marca si puede
-- publicarse. La ingesta manual y la planilla entran validadas porque las escribe
-- un usuario con rol; el OCR del Sprint 4 entrará con validado = false hasta que
-- un fiscalizador la revise.

alter table public.precios
  add column if not exists origen text not null default 'manual';

alter table public.precios
  add column if not exists validado boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'precios_origen_check'
  ) then
    alter table public.precios
      add constraint precios_origen_check
      check (origen in ('manual', 'csv', 'ocr', 'api'));
  end if;
end $$;

comment on column public.precios.origen is
  'Vía de ingesta del precio: manual, csv, ocr o api.';
comment on column public.precios.validado is
  'Si es false el precio existe pero no se publica en comparador ni historial.';

-- El comparador y el historial filtran por validado. Índice parcial: solo
-- interesan las filas publicables.
create index if not exists idx_precios_validado
  on public.precios (id_producto, id_comercio, vigente_desde desc)
  where validado;

-- Las 60 filas del seed se cargaron por SQL, así que quedan como 'manual'.
-- No se tocan: el default ya las cubre.

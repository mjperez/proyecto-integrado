-- =====================================================================
-- Seed del Sprint 1
--
-- Meta de cierre del cronograma: "catálogo con 10 productos y 6 comercios
-- con precios cargados". Este archivo carga exactamente eso.
--
-- QUÉ ES REAL Y QUÉ NO
--   - Categorías y productos: canasta básica chilena. Las marcas que
--     aparecen son reales y corresponden a su producto real.
--   - Aliases: chilenismos reales (choclo, aguacate, banana).
--   - Comercios, direcciones, coordenadas y precios: DATOS DE PRUEBA.
--     No corresponden a locales ni a precios reales de la comuna.
--
-- Idempotente: se puede correr varias veces sin duplicar.
-- =====================================================================

-- ---------------------------------------------------------------- roles
insert into public.roles (nombre) values
  ('vecino'), ('comercio'), ('terreno'), ('administrador')
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------- categorías
insert into public.categorias (nombre, descripcion) values
  ('Pan y cereales',          'Pan, arroz, fideos, harina, avena'),
  ('Lácteos y huevos',        'Leche, queso, yogur, huevos'),
  ('Carnes y embutidos',      'Vacuno, pollo, cerdo, cecinas'),
  ('Verduras y tubérculos',   'Papas, cebolla, tomate, zapallo'),
  ('Frutas',                  'Plátano, manzana, naranja, palta'),
  ('Aceites y grasas',        'Aceite vegetal, margarina, manteca'),
  ('Legumbres y conservas',   'Porotos, lentejas, garbanzos, atún, jurel'),
  ('Azúcar y endulzantes',    'Azúcar, azúcar flor, miel'),
  ('Bebidas e infusiones',    'Té, café, bebidas, jugos'),
  ('Aseo y cuidado personal', 'Detergente, jabón, papel higiénico')
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------- productos (US-A1)
insert into public.productos (nombre, marca, formato, unidad, id_categoria)
select v.nombre, v.marca, v.formato, v.unidad, c.id_categoria
from (values
  ('Pan corriente (marraqueta)',   'sin marca', '1 kg',   'kg',   'Pan y cereales'),
  ('Arroz grado 2',                'sin marca', '1 kg',   'kg',   'Pan y cereales'),
  ('Fideos spaghetti',             'Carozzi',   '400 g',  'un',   'Pan y cereales'),
  ('Harina sin polvos de hornear', 'sin marca', '1 kg',   'kg',   'Pan y cereales'),
  ('Aceite vegetal',               'Chef',      '900 ml', 'un',   'Aceites y grasas'),
  ('Leche entera',                 'Soprole',   '1 L',    'un',   'Lácteos y huevos'),
  ('Huevos de gallina',            'sin marca', '12 un',  'caja', 'Lácteos y huevos'),
  ('Azúcar',                       'Iansa',     '1 kg',   'kg',   'Azúcar y endulzantes'),
  ('Té en bolsitas',               'Supremo',   '100 un', 'caja', 'Bebidas e infusiones'),
  ('Papas',                        'sin marca', '1 kg',   'kg',   'Verduras y tubérculos')
) as v(nombre, marca, formato, unidad, categoria)
join public.categorias c on c.nombre = v.categoria
on conflict (nombre, marca, formato, unidad) do nothing;

-- ---------------------------------------------------------------- comercios (US-B1)
insert into public.comercios (nombre, direccion, tipo, ubicacion)
select v.nombre, v.direccion, v.tipo,
       st_setsrid(st_makepoint(v.lng, v.lat), 4326)::geography
from (values
  ('Almacén de prueba 1',    'Dirección de prueba 1, Pedro Aguirre Cerda', 'almacen',     -33.4910, -70.7120),
  ('Almacén de prueba 2',    'Dirección de prueba 2, Pedro Aguirre Cerda', 'almacen',     -33.4935, -70.7160),
  ('Feria de prueba 3',      'Dirección de prueba 3, Pedro Aguirre Cerda', 'feria_libre', -33.4880, -70.7185),
  ('Panadería de prueba 4',  'Dirección de prueba 4, Pedro Aguirre Cerda', 'panaderia',   -33.4960, -70.7105),
  ('Minimarket de prueba 5', 'Dirección de prueba 5, Pedro Aguirre Cerda', 'minimarket',  -33.4900, -70.7200),
  ('Minimarket de prueba 6', 'Dirección de prueba 6, Pedro Aguirre Cerda', 'minimarket',  -33.4950, -70.7230)
) as v(nombre, direccion, tipo, lat, lng)
on conflict (nombre, direccion) do nothing;

-- ---------------------------------------------------------------- aliases (US-A2)
-- En el modelo del SDD el alias apunta a categoría, así que solo se
-- cargan sinónimos de categoría. Los sinónimos de producto (marraqueta,
-- pan batido) quedan para el ajuste 0004.
insert into public.aliases (alias, id_categoria)
select v.alias, c.id_categoria
from (values
  ('choclo',         'Verduras y tubérculos'),
  ('papa',           'Verduras y tubérculos'),
  ('gaseosa',        'Bebidas e infusiones'),
  ('bebida',         'Bebidas e infusiones'),
  ('aguacate',       'Frutas'),
  ('banana',         'Frutas'),
  ('dulce de leche', 'Azúcar y endulzantes')
) as v(alias, categoria)
join public.categorias c on c.nombre = v.categoria
on conflict (alias) do nothing;

-- ---------------------------------------------------------------- precios (US-C1)
-- Un valor base por producto y un factor por comercio, redondeado a la
-- decena como se anota en terreno. Solo inserta si la tabla está vacía.
insert into public.precios (valor, id_producto, id_comercio, fecha_registro)
select round(b.base * f.factor / 10) * 10,
       p.id_producto,
       c.id_comercio,
       now() - make_interval(days => f.dias)
from (values
  ('Pan corriente (marraqueta)',   1290),
  ('Arroz grado 2',                1590),
  ('Fideos spaghetti',              990),
  ('Harina sin polvos de hornear', 1190),
  ('Aceite vegetal',               2490),
  ('Leche entera',                 1190),
  ('Huevos de gallina',            3190),
  ('Azúcar',                       1390),
  ('Té en bolsitas',               2190),
  ('Papas',                        1090)
) as b(producto, base)
join public.productos p on p.nombre = b.producto
cross join (values
  ('Almacén de prueba 1',    1.00, 0),
  ('Almacén de prueba 2',    1.05, 1),
  ('Feria de prueba 3',      0.92, 0),
  ('Panadería de prueba 4',  1.02, 2),
  ('Minimarket de prueba 5', 1.08, 1),
  ('Minimarket de prueba 6', 1.10, 3)
) as f(comercio, factor, dias)
join public.comercios c on c.nombre = f.comercio
where not exists (select 1 from public.precios);

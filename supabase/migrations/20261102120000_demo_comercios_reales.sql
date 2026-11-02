-- 0024 · comercios reales de la comuna en lugar de nombres inventados
-- María pasó un listado de comercios de Pedro Aguirre Cerda. Se eligen seis que
-- cubren los seis formatos del alcance del observatorio, uno por tipo, para que
-- el mapa y el comparador muestren la variedad que el sistema tiene que
-- soportar: feria libre, almacén de barrio, minimarket, supermercado, panadería
-- y microemprendimiento.
--
-- Nombres y direcciones salen del listado. Las coordenadas NO se tocan: siguen
-- siendo los puntos de prueba del seed, así que la posición en el mapa es
-- aproximada y no corresponde a la dirección exacta.

update public.comercios set nombre = 'Almacén Sanhueza',
                           direccion = 'Club Hípico 4216, Pedro Aguirre Cerda',
                           tipo = 'almacen'
where id_comercio = 1;

update public.comercios set nombre = 'Minimarket Claudia y Luis',
                           direccion = 'Manuela Errázuriz 4954, Pedro Aguirre Cerda',
                           tipo = 'minimarket'
where id_comercio = 2;

update public.comercios set nombre = 'Feria Libre Población La Victoria',
                           direccion = 'Galo González 4464, Pedro Aguirre Cerda',
                           tipo = 'feria_libre'
where id_comercio = 3;

update public.comercios set nombre = 'Panadería San Pedro',
                           direccion = 'San Nicolás 1828, Pedro Aguirre Cerda',
                           tipo = 'panaderia'
where id_comercio = 4;

update public.comercios set nombre = 'Supermercado Best Market',
                           direccion = 'Av. Clotario Blest 5500, Pedro Aguirre Cerda',
                           tipo = 'supermercado'
where id_comercio = 5;

update public.comercios set nombre = 'La Veguita a tu Puerta',
                           direccion = 'Av. Maipú 3301, Local 94, Pedro Aguirre Cerda',
                           tipo = 'microemprendimiento'
where id_comercio = 6;

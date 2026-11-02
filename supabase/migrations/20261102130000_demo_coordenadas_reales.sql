-- 0025 · coordenadas reales de los seis comercios
-- Los puntos del seed estaban en longitud -70,7166, que cae al oeste del límite
-- comunal: en Cerrillos. Al cambiar los nombres por comercios reales de Pedro
-- Aguirre Cerda, el mapa seguía mostrando los pines en la comuna vecina.
--
-- Las coordenadas salen de geocodificar cada dirección con Nominatim
-- (OpenStreetMap). Las seis caen dentro del bounding box de la comuna:
-- lat -33,5108 a -33,4757 y lng -70,6952 a -70,6549.
--
-- El centroide que usa el comparador como referencia se calcula en cada
-- consulta sobre los comercios activos, así que se corrige solo.

update public.comercios
set ubicacion = st_setsrid(st_makepoint(-70.665319, -33.487920), 4326)::geography
where id_comercio = 1;  -- Almacén Sanhueza, Club Hípico 4216

update public.comercios
set ubicacion = st_setsrid(st_makepoint(-70.668355, -33.494407), 4326)::geography
where id_comercio = 2;  -- Minimarket Claudia y Luis, Manuela Errázuriz 4954

update public.comercios
set ubicacion = st_setsrid(st_makepoint(-70.676112, -33.487458), 4326)::geography
where id_comercio = 3;  -- Feria Libre Población La Victoria, Galo González 4464

update public.comercios
set ubicacion = st_setsrid(st_makepoint(-70.665898, -33.495663), 4326)::geography
where id_comercio = 4;  -- Panadería San Pedro, San Nicolás 1828

update public.comercios
set ubicacion = st_setsrid(st_makepoint(-70.677890, -33.497811), 4326)::geography
where id_comercio = 5;  -- Supermercado Best Market, Av. Clotario Blest 5500

update public.comercios
set ubicacion = st_setsrid(st_makepoint(-70.683646, -33.482083), 4326)::geography
where id_comercio = 6;  -- La Veguita a tu Puerta, Av. Maipú 3301

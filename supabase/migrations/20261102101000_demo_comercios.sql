-- 0020 · nombres y direcciones verosímiles para los comercios de demostración
-- El seed del Sprint 1 dejó los seis comercios como "Almacén de prueba 1" y
-- "Dirección de prueba 1". Sirve para probar, pero en la demo el profesor lo
-- primero que ve es una lista de datos ficticios rotulados como tales.
--
-- Se reemplazan por nombres y direcciones del tipo de comercio que representa
-- cada fila, dentro de la comuna. Siguen siendo datos de demostración: los
-- precios son inventados y ninguna de estas direcciones corresponde a un
-- comercio verificado en terreno.

update public.comercios set nombre = 'Almacén Doña Rosa',
                           direccion = 'Av. Los Cerrillos 1420, Pedro Aguirre Cerda'
where id_comercio = 1;

update public.comercios set nombre = 'Almacén Los Aromos',
                           direccion = 'Calle Alhué 238, Pedro Aguirre Cerda'
where id_comercio = 2;

update public.comercios set nombre = 'Feria Libre Los Cerrillos',
                           direccion = 'Calle Barros Luco 1150, Pedro Aguirre Cerda'
where id_comercio = 3;

update public.comercios set nombre = 'Panadería San Nicolás',
                           direccion = 'Av. Pedro Aguirre Cerda 5210, Pedro Aguirre Cerda'
where id_comercio = 4;

update public.comercios set nombre = 'Minimarket El Trébol',
                           direccion = 'Calle Sanfuentes 874, Pedro Aguirre Cerda'
where id_comercio = 5;

update public.comercios set nombre = 'Minimarket Doña Elba',
                           direccion = 'Av. Departamental 3300, Pedro Aguirre Cerda'
where id_comercio = 6;

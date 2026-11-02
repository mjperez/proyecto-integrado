-- 0022 · direcciones de demostración dentro de la comuna
-- La 0020 usó «Av. Los Cerrillos» y «Feria Libre Los Cerrillos». Los Cerrillos
-- es la comuna vecina, así que el nombre confundía: parecía que el observatorio
-- estaba mezclando comunas.
--
-- Se reemplazan por avenidas y sectores de Pedro Aguirre Cerda. Las direcciones
-- siguen siendo de fantasía: no corresponden a comercios verificados en terreno.
-- Lo que sí es de la comuna es la referencia de sector.

update public.comercios set nombre = 'Almacén Doña Rosa',
                           direccion = 'Pasaje Los Aromos 142, Villa Sur'
where id_comercio = 1;

update public.comercios set nombre = 'Almacén Los Aromos',
                           direccion = 'Pasaje El Mirador 238, Villa Sur'
where id_comercio = 2;

update public.comercios set nombre = 'Feria Libre La Victoria',
                           direccion = 'Av. Pedro Aguirre Cerda 4350, La Victoria'
where id_comercio = 3;

update public.comercios set nombre = 'Panadería San Nicolás',
                           direccion = 'Av. Pedro Aguirre Cerda 5210'
where id_comercio = 4;

update public.comercios set nombre = 'Minimarket El Trébol',
                           direccion = 'Pasaje Santa Elena 874, Lo Valledor'
where id_comercio = 5;

update public.comercios set nombre = 'Minimarket Doña Elba',
                           direccion = 'Av. Departamental 3300'
where id_comercio = 6;

-- 0021 · cuenta de demostración con rol administrador
-- El panel de administración, el tablero y la ingesta nunca se probaron con una
-- sesión real porque no había ninguna cuenta. Esta migración enlaza la cuenta
-- de Supabase Auth con su fila en `usuarios` y le asigna el rol que abre las
-- tres rutas.
--
-- La cuenta se crea antes por la vía pública de Supabase Auth (signup con
-- correo y contraseña). Si no existe, la migración no inserta nada y no falla:
-- así el archivo se puede aplicar en cualquier entorno sin arrastrar la cuenta.
--
-- Es una cuenta de demostración. Antes de publicar el sistema en producción
-- hay que borrarla y crear las cuentas reales del municipio.

insert into public.usuarios (nombre, email, auth_uid, id_rol)
select 'Cuenta de demostración',
       u.email,
       u.id,
       (select id_rol from public.roles where nombre = 'administrador')
from auth.users u
where u.email = 'demo@pac.cl'
  and not exists (
    select 1 from public.usuarios x where x.email = u.email
  );

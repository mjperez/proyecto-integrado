# Observatorio Comunal de Precios

Aplicación web del proyecto TIHI43 (INACAP 2026). Publica los precios de alimentos y productos básicos relevados en los comercios de Pedro Aguirre Cerda, y entrega un panel de administración para mantener el catálogo y cargar precios.

## Stack

Next.js 16 con App Router, React 19, Tailwind CSS 4 y Supabase (PostgreSQL con PostGIS, Auth y RLS).

## Puesta en marcha

Requiere Node 20 o superior.

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:3000`.

Las credenciales de Supabase van en `.env.local`, que no se versiona:

```
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Cuenta de demostración

| Correo | Contraseña | Rol |
|---|---|---|
| `demo@pac.cl` | `Demo.Pac.2026` | administrador |

Abre el panel en `/admin`, el tablero en `/dashboard` y la carga de precios en `/ingesta`. Es una cuenta de demostración: antes de publicar el sistema en producción hay que borrarla y crear las cuentas reales del municipio.

## Rutas

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/` | público | Portada con los precios vigentes |
| `/comparador` | público | Comparador por producto, orden por precio o cercanía, con historial |
| `/mapa` | público | Mapa de comercios |
| `/login` | público | Acceso funcionario |
| `/dashboard` | sesión | Tablero de control |
| `/ingesta` | comercio, terreno, administrador | Carga manual de precios |
| `/ingesta/csv` | comercio, terreno, administrador | Carga masiva por planilla |
| `/admin` | administrador | Mantenedores de catálogo, comercios y auditoría |

## Base de datos

Las migraciones están en `supabase/migrations` y se aplican en orden con la CLI de Supabase:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

El esquema usa tablas en plural (`productos`, `comercios`, `precios`, `usuarios`) y columnas en singular. El comparador se resuelve en la función `fn_comparador`, que devuelve un precio vigente y validado por comercio con la distancia al punto del vecino o al centroide comunal.

## Pruebas

```bash
npm test          # unitarias
npm run lint      # eslint
npx tsc --noEmit  # tipos
npm run build     # compilación de producción
```

## Accesibilidad

Las cuatro pantallas principales obtienen 100 en la categoría de accesibilidad de Lighthouse 12: portada, comparador, mapa y acceso. La verificación cubre contraste, nombres accesibles, jerarquía de encabezados y orden de tabulación.

## Datos

Los precios y comercios que trae la base son de demostración. Las direcciones son verosímiles pero no corresponden a comercios verificados en terreno.

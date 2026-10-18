import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { TIPOS_COMERCIO, etiquetaTipo } from "@/lib/tipos_comercio";
import { crearComercio, desactivarComercio } from "./acciones";

const ERRORES: Record<string, string> = {
  incompleto: "Nombre y dirección son obligatorios.",
  tipo: "El tipo de comercio no es válido.",
  coordenada: "Las coordenadas están fuera de la comuna o no son numéricas.",
  matriz: "La matriz seleccionada no es válida.",
  jerarquia: "Solo se permiten dos niveles: una sucursal no puede ser matriz.",
  duplicado: "Ya existe un comercio con ese nombre y esa dirección.",
};

const CAMPO =
  "w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export default async function ComerciosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: comercios } = await supabase
    .from("comercios")
    .select("id_comercio, nombre, direccion, tipo, activo, id_matriz")
    .order("nombre");

  const lista = comercios ?? [];
  const nombrePorId = new Map(lista.map((c) => [c.id_comercio, c.nombre]));
  // Solo una matriz activa puede recibir sucursales nuevas.
  const matrices = lista.filter((c) => c.id_matriz === null && c.activo);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-background p-6">
      <Link
        href="/admin"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver al panel
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Comercios</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Comercio matriz y sucursales del observatorio (US-B1).
      </p>

      {error && ERRORES[error] && (
        <p className="mb-4 rounded border border-pac-rojo bg-pac-rojo/10 p-3 text-sm text-pac-rojo">
          {ERRORES[error]}
        </p>
      )}

      <form
        action={crearComercio}
        className="mb-8 rounded-lg border border-border bg-card p-4"
      >
        <h2 className="mb-3 font-semibold">Nuevo comercio</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input name="nombre" required placeholder="Almacén Doña Rosa" className={CAMPO} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Dirección
            <input
              name="direccion"
              required
              placeholder="Av. Padre Esteban Gumucio 1230"
              className={CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Tipo
            <select name="tipo" required defaultValue="" className={CAMPO}>
              <option value="" disabled>
                Selecciona un tipo
              </option>
              {TIPOS_COMERCIO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Sucursal de
            <select name="id_matriz" defaultValue="" className={CAMPO}>
              <option value="">Es matriz o local independiente</option>
              {matrices.map((m) => (
                <option key={m.id_comercio} value={m.id_comercio}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Latitud
            <input
              name="lat"
              type="number"
              step="0.000001"
              required
              placeholder="-33.4910"
              className={CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Longitud
            <input
              name="lng"
              type="number"
              step="0.000001"
              required
              placeholder="-70.7120"
              className={CAMPO}
            />
          </label>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" name="activo" defaultChecked /> Activo
        </label>

        <button
          type="submit"
          className="mt-4 w-full rounded bg-primary py-2 font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
        >
          Crear
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {lista.map((c) => (
          <li
            key={c.id_comercio}
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-card p-3"
          >
            <div>
              <strong>{c.nombre}</strong>
              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {etiquetaTipo(c.tipo)}
              </span>
              <span
                className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                  c.activo
                    ? "bg-pac-verde/10 text-pac-verde"
                    : "bg-pac-naranjo/10 text-pac-naranjo"
                }`}
              >
                {c.activo ? "activo" : "inactivo"}
              </span>
              <div className="text-sm text-muted-foreground">{c.direccion}</div>
              {c.id_matriz !== null && (
                <div className="text-xs text-pac-celeste">
                  Sucursal de {nombrePorId.get(c.id_matriz) ?? `#${c.id_matriz}`}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/comercios/${c.id_comercio}/editar`}
                className="rounded border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
              >
                Editar
              </Link>
              {c.activo && (
                <form action={desactivarComercio}>
                  <input type="hidden" name="id" value={c.id_comercio} />
                  <button
                    type="submit"
                    className="rounded border border-pac-rojo px-3 py-1 text-sm font-medium text-pac-rojo transition-colors hover:bg-pac-rojo/10"
                  >
                    Desactivar
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay comercios todavía.</p>
        )}
      </ul>
    </main>
  );
}

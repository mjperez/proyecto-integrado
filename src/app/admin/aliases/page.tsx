import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { crearAlias, eliminarAlias } from "./acciones";

const ERRORES: Record<string, string> = {
  alias: "El alias no puede estar vacío ni superar los 100 caracteres.",
  destino: "Selecciona una categoría o un producto de destino.",
  duplicado: "Ese alias ya existe. Cada alias apunta a un solo destino.",
};

const CAMPO =
  "w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export default async function AliasesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [aliases, categorias, productos] = await Promise.all([
    supabase
      .from("aliases")
      .select(
        "id_alias, alias, id_categoria, id_producto, categorias(nombre), productos(nombre, marca, formato)",
      )
      .order("alias"),
    supabase.from("categorias").select("id_categoria, nombre").eq("activo", true).order("nombre"),
    supabase
      .from("productos")
      .select("id_producto, nombre, marca, formato")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const lista = aliases.data ?? [];
  const categoriasActivas = categorias.data ?? [];
  const productosActivos = productos.data ?? [];
  const sinDestinos = categoriasActivas.length === 0 && productosActivos.length === 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-background p-6">
      <Link
        href="/admin"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver al panel
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Aliases</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Sinónimos que apuntan a una categoría o a un producto canónico (US-A2).
      </p>

      {error && ERRORES[error] && (
        <p className="mb-4 rounded border border-pac-rojo bg-pac-rojo/10 p-3 text-sm text-pac-rojo">
          {ERRORES[error]}
        </p>
      )}

      {sinDestinos ? (
        <p className="mb-4 rounded border border-pac-naranjo bg-pac-naranjo/10 p-3 text-sm text-pac-naranjo">
          No hay categorías ni productos activos. Crea alguno antes de agregar aliases.
        </p>
      ) : (
        <form
          action={crearAlias}
          className="mb-8 rounded-lg border border-border bg-card p-4"
        >
          <h2 className="mb-3 font-semibold">Nuevo alias</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Alias
              <input
                name="alias"
                required
                maxLength={100}
                placeholder="marraqueta"
                className={CAMPO}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Apunta a
              <select name="destino" required defaultValue="" className={CAMPO}>
                <option value="" disabled>
                  Selecciona un destino
                </option>
                {categoriasActivas.length > 0 && (
                  <optgroup label="Categorías">
                    {categoriasActivas.map((c) => (
                      <option key={`c-${c.id_categoria}`} value={`categoria:${c.id_categoria}`}>
                        {c.nombre}
                      </option>
                    ))}
                  </optgroup>
                )}
                {productosActivos.length > 0 && (
                  <optgroup label="Productos">
                    {productosActivos.map((p) => (
                      <option key={`p-${p.id_producto}`} value={`producto:${p.id_producto}`}>
                        {p.nombre} · {p.marca} · {p.formato}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded bg-primary py-2 font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
          >
            Crear
          </button>
        </form>
      )}

      <ul className="flex flex-col gap-2">
        {lista.map((a) => (
          <li
            key={a.id_alias}
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-card p-3"
          >
            <div>
              <strong>{a.alias}</strong>
              <span className="ml-2 text-sm text-muted-foreground">→</span>
              {a.id_categoria !== null ? (
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  categoría: {a.categorias?.nombre ?? `#${a.id_categoria}`}
                </span>
              ) : (
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  producto:{" "}
                  {a.productos
                    ? `${a.productos.nombre} · ${a.productos.marca} · ${a.productos.formato}`
                    : `#${a.id_producto}`}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/aliases/${a.id_alias}/editar`}
                className="rounded border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
              >
                Editar
              </Link>
              <form action={eliminarAlias}>
                <input type="hidden" name="id" value={a.id_alias} />
                <button
                  type="submit"
                  className="rounded border border-pac-rojo px-3 py-1 text-sm font-medium text-pac-rojo transition-colors hover:bg-pac-rojo/10"
                >
                  Eliminar
                </button>
              </form>
            </div>
          </li>
        ))}
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay aliases todavía.</p>
        )}
      </ul>
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { UNIDADES_PRODUCTO } from "@/lib/unidades_producto";
import { crearProducto, desactivarProducto } from "./acciones";

const ERRORES: Record<string, string> = {
  incompleto: "Nombre, marca y formato son obligatorios.",
  unidad: "La unidad no es válida.",
  categoria: "Selecciona una categoría válida.",
  duplicado:
    "Ya existe un producto con ese nombre, marca, formato y unidad. Si lo retiraste, reactívalo desde su ficha.",
};

const CAMPO =
  "w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [productos, categorias] = await Promise.all([
    supabase
      .from("productos")
      .select("id_producto, nombre, marca, formato, unidad, activo, categorias(nombre)")
      .order("nombre"),
    supabase
      .from("categorias")
      .select("id_categoria, nombre")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const lista = productos.data ?? [];
  const categoriasActivas = categorias.data ?? [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-background p-6">
      <Link
        href="/admin"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver al panel
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Productos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Catálogo maestro de productos con su categoría canónica (US-A1).
      </p>

      {error && ERRORES[error] && (
        <p className="mb-4 rounded border border-pac-rojo bg-pac-rojo/10 p-3 text-sm text-pac-rojo">
          {ERRORES[error]}
        </p>
      )}

      {categoriasActivas.length === 0 ? (
        <p className="mb-4 rounded border border-pac-naranjo bg-pac-naranjo/10 p-3 text-sm text-pac-naranjo">
          No hay categorías activas. Crea una en{" "}
          <Link href="/admin/categorias" className="font-medium underline">
            Categorías
          </Link>{" "}
          antes de dar de alta productos.
        </p>
      ) : (
        <form
          action={crearProducto}
          className="mb-8 rounded-lg border border-border bg-card p-4"
        >
          <h2 className="mb-3 font-semibold">Nuevo producto</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nombre
              <input
                name="nombre"
                required
                placeholder="Pan corriente (marraqueta)"
                className={CAMPO}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Marca
              <input name="marca" required placeholder="sin marca" className={CAMPO} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Formato
              <input name="formato" required placeholder="1 kg" className={CAMPO} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Unidad
              <select name="unidad" required defaultValue="" className={CAMPO}>
                <option value="" disabled>
                  Selecciona una unidad
                </option>
                {UNIDADES_PRODUCTO.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Categoría
              <select name="id_categoria" required defaultValue="" className={CAMPO}>
                <option value="" disabled>
                  Selecciona una categoría
                </option>
                {categoriasActivas.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>
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
      )}

      <ul className="flex flex-col gap-2">
        {lista.map((p) => (
          <li
            key={p.id_producto}
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-card p-3"
          >
            <div>
              <strong>{p.nombre}</strong>
              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {p.marca} · {p.formato} · {p.unidad}
              </span>
              <span
                className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                  p.activo
                    ? "bg-pac-verde/10 text-pac-verde"
                    : "bg-pac-naranjo/10 text-pac-naranjo"
                }`}
              >
                {p.activo ? "activo" : "inactivo"}
              </span>
              <div className="text-xs text-pac-celeste">
                {p.categorias?.nombre ?? "Sin categoría"}
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/productos/${p.id_producto}/editar`}
                className="rounded border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
              >
                Editar
              </Link>
              {p.activo && (
                <form action={desactivarProducto}>
                  <input type="hidden" name="id" value={p.id_producto} />
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
          <p className="text-sm text-muted-foreground">No hay productos todavía.</p>
        )}
      </ul>
    </main>
  );
}

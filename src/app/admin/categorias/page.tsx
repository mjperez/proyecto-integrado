import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { crearCategoria, desactivarCategoria } from "./acciones";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("id_categoria, nombre, descripcion, activo")
    .order("nombre");

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl bg-background p-6">
      <Link
        href="/admin"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver al panel
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Categorías</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Catálogo maestro de categorías de productos (US-A3).
      </p>

      {error === "duplicado" && (
        <p className="mb-4 rounded border border-pac-rojo bg-pac-rojo/10 p-3 text-sm text-pac-rojo">
          Ya existe una categoría con ese nombre.
        </p>
      )}

      <form
        action={crearCategoria}
        className="mb-8 rounded-lg border border-border bg-card p-4"
      >
        <h2 className="mb-3 font-semibold">Nueva categoría</h2>
        <div className="flex flex-col gap-3">
          <input
            name="nombre"
            required
            placeholder="Nombre"
            className="w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <input
            name="descripcion"
            placeholder="Descripción (opcional)"
            className="w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activo" defaultChecked /> Activa
          </label>
          <button
            type="submit"
            className="rounded bg-primary py-2 font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
          >
            Crear
          </button>
        </div>
      </form>

      <ul className="flex flex-col gap-2">
        {categorias?.map((c) => (
          <li
            key={c.id_categoria}
            className="flex items-center justify-between rounded border border-border bg-card p-3"
          >
            <div>
              <strong>{c.nombre}</strong>
              <span
                className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                  c.activo
                    ? "bg-pac-verde/10 text-pac-verde"
                    : "bg-pac-naranjo/10 text-pac-naranjo"
                }`}
              >
                {c.activo ? "activa" : "inactiva"}
              </span>
              {c.descripcion && (
                <div className="text-sm text-muted-foreground">{c.descripcion}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/categorias/${c.id_categoria}/editar`}
                className="rounded border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
              >
                Editar
              </Link>
              <form action={desactivarCategoria}>
                <input type="hidden" name="id" value={c.id_categoria} />
                <button
                  type="submit"
                  className="rounded border border-pac-rojo px-3 py-1 text-sm font-medium text-pac-rojo transition-colors hover:bg-pac-rojo/10"
                >
                  Desactivar
                </button>
              </form>
            </div>
          </li>
        ))}
        {categorias?.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay categorías todavía.</p>
        )}
      </ul>
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { actualizarAlias } from "../../acciones";

const CAMPO =
  "w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export default async function EditarAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: alias }, { data: categorias }, { data: productos }] = await Promise.all([
    supabase
      .from("aliases")
      .select("id_alias, alias, id_categoria, id_producto")
      .eq("id_alias", Number(id))
      .maybeSingle(),
    supabase.from("categorias").select("id_categoria, nombre, activo").order("nombre"),
    supabase
      .from("productos")
      .select("id_producto, nombre, marca, formato, activo")
      .order("nombre"),
  ]);

  if (!alias) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
        <p>Alias no encontrado.</p>
        <Link href="/admin/aliases" className="text-sm text-pac-celeste hover:underline">
          ← Volver
        </Link>
      </main>
    );
  }

  // El destino actual se ofrece aunque esté inactivo, para no mover el alias
  // sin querer al guardar.
  const opcionesCategoria = (categorias ?? []).filter(
    (c) => c.activo || c.id_categoria === alias.id_categoria,
  );
  const opcionesProducto = (productos ?? []).filter(
    (p) => p.activo || p.id_producto === alias.id_producto,
  );

  const destinoActual =
    alias.id_categoria !== null
      ? `categoria:${alias.id_categoria}`
      : `producto:${alias.id_producto}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
      <Link
        href="/admin/aliases"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Editar alias</h1>

      <form
        action={actualizarAlias}
        className="mt-4 rounded-lg border border-border bg-card p-4"
      >
        <input type="hidden" name="id" value={alias.id_alias} />

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Alias
            <input
              name="alias"
              required
              maxLength={100}
              defaultValue={alias.alias}
              className={CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Apunta a
            <select name="destino" required defaultValue={destinoActual} className={CAMPO}>
              {opcionesCategoria.length > 0 && (
                <optgroup label="Categorías">
                  {opcionesCategoria.map((c) => (
                    <option key={`c-${c.id_categoria}`} value={`categoria:${c.id_categoria}`}>
                      {c.nombre}
                      {c.activo ? "" : " (inactiva)"}
                    </option>
                  ))}
                </optgroup>
              )}
              {opcionesProducto.length > 0 && (
                <optgroup label="Productos">
                  {opcionesProducto.map((p) => (
                    <option key={`p-${p.id_producto}`} value={`producto:${p.id_producto}`}>
                      {p.nombre} · {p.marca} · {p.formato}
                      {p.activo ? "" : " (inactivo)"}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <button
            type="submit"
            className="rounded bg-primary py-2 font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
          >
            Guardar
          </button>
        </div>
      </form>
    </main>
  );
}

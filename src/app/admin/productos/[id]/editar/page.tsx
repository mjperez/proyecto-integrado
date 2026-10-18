import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { UNIDADES_PRODUCTO } from "@/lib/unidades_producto";
import { actualizarProducto } from "../../acciones";

const CAMPO =
  "w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: producto }, { data: categorias }] = await Promise.all([
    supabase
      .from("productos")
      .select("id_producto, nombre, marca, formato, unidad, id_categoria, activo")
      .eq("id_producto", Number(id))
      .maybeSingle(),
    supabase.from("categorias").select("id_categoria, nombre, activo").order("nombre"),
  ]);

  if (!producto) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
        <p>Producto no encontrado.</p>
        <Link href="/admin/productos" className="text-sm text-pac-celeste hover:underline">
          ← Volver
        </Link>
      </main>
    );
  }

  // La categoría actual se ofrece aunque esté inactiva, para no cambiar el
  // producto de categoría sin querer al guardar.
  const opcionesCategoria = (categorias ?? []).filter(
    (c) => c.activo || c.id_categoria === producto.id_categoria,
  );

  // Si el producto trae una unidad fuera de la lista (carga antigua), se agrega
  // como opción para no alterarla al guardar.
  const unidades = (UNIDADES_PRODUCTO as readonly string[]).includes(producto.unidad)
    ? UNIDADES_PRODUCTO
    : [...UNIDADES_PRODUCTO, producto.unidad];

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
      <Link
        href="/admin/productos"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Editar producto</h1>

      <form
        action={actualizarProducto}
        className="mt-4 rounded-lg border border-border bg-card p-4"
      >
        <input type="hidden" name="id" value={producto.id_producto} />

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input
              name="nombre"
              required
              defaultValue={producto.nombre}
              className={CAMPO}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Marca
              <input name="marca" required defaultValue={producto.marca} className={CAMPO} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Formato
              <input
                name="formato"
                required
                defaultValue={producto.formato}
                className={CAMPO}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Unidad
            <select name="unidad" required defaultValue={producto.unidad} className={CAMPO}>
              {unidades.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Categoría
            <select
              name="id_categoria"
              required
              defaultValue={producto.id_categoria}
              className={CAMPO}
            >
              {opcionesCategoria.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                  {c.activo ? "" : " (inactiva)"}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activo" defaultChecked={producto.activo} /> Activo
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

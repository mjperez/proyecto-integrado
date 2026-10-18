import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { actualizarCategoria } from "../../acciones";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: categoria } = await supabase
    .from("categorias")
    .select("id_categoria, nombre, descripcion, activo")
    .eq("id_categoria", Number(id))
    .single();

  if (!categoria) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
        <p>Categoría no encontrada.</p>
        <Link href="/admin/categorias" className="text-sm text-pac-celeste hover:underline">
          ← Volver
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
      <Link
        href="/admin/categorias"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Editar categoría</h1>

      <form
        action={actualizarCategoria}
        className="mt-4 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex flex-col gap-3">
          <input type="hidden" name="id" value={categoria.id_categoria} />
          <input
            name="nombre"
            required
            defaultValue={categoria.nombre}
            className="w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <input
            name="descripcion"
            defaultValue={categoria.descripcion ?? ""}
            placeholder="Descripción (opcional)"
            className="w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activo" defaultChecked={categoria.activo} /> Activa
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

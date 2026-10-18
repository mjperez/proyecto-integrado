import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { TIPOS_COMERCIO } from "@/lib/tipos_comercio";
import { actualizarComercio } from "../../acciones";

const CAMPO =
  "w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export default async function EditarComercioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: comercio }, { data: todos }] = await Promise.all([
    supabase
      .from("v_comercios_coordenadas")
      .select("*")
      .eq("id_comercio", Number(id))
      .maybeSingle(),
    supabase
      .from("comercios")
      .select("id_comercio, nombre, id_matriz, activo")
      .order("nombre"),
  ]);

  if (!comercio) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
        <p>Comercio no encontrado.</p>
        <Link href="/admin/comercios" className="text-sm text-pac-celeste hover:underline">
          ← Volver
        </Link>
      </main>
    );
  }

  const lista = todos ?? [];
  const conSucursales = new Set(
    lista.filter((c) => c.id_matriz !== null).map((c) => c.id_matriz),
  );

  // Una matriz con sucursales no puede convertirse en sucursal (lo bloquea el
  // trigger), y un comercio no puede ser su propia matriz. La matriz actual
  // siempre queda disponible para no romper la edición.
  const candidatas = lista.filter(
    (c) =>
      c.id_comercio !== comercio.id_comercio &&
      c.id_matriz === null &&
      c.activo &&
      (c.id_comercio === comercio.id_matriz || !conSucursales.has(c.id_comercio)),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
      <Link
        href="/admin/comercios"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Editar comercio</h1>

      <form
        action={actualizarComercio}
        className="mt-4 rounded-lg border border-border bg-card p-4"
      >
        <input type="hidden" name="id" value={comercio.id_comercio ?? ""} />

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input
              name="nombre"
              required
              defaultValue={comercio.nombre ?? ""}
              className={CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Dirección
            <input
              name="direccion"
              required
              defaultValue={comercio.direccion ?? ""}
              className={CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Tipo
            <select name="tipo" required defaultValue={comercio.tipo ?? ""} className={CAMPO}>
              {TIPOS_COMERCIO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Sucursal de
            <select
              name="id_matriz"
              defaultValue={comercio.id_matriz ?? ""}
              className={CAMPO}
            >
              <option value="">Es matriz o local independiente</option>
              {candidatas.map((c) => (
                <option key={c.id_comercio} value={c.id_comercio}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Latitud
              <input
                name="lat"
                type="number"
                step="0.000001"
                required
                defaultValue={comercio.lat ?? ""}
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
                defaultValue={comercio.lng ?? ""}
                className={CAMPO}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activo" defaultChecked={comercio.activo ?? false} />{" "}
            Activo
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

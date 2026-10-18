import Link from "next/link";
import { requerirRol } from "@/lib/auth";
import FormularioCsv from "./formulario";

export default async function CargaCsvPage() {
  const { supabase, perfil, rol } = await requerirRol(
    "comercio",
    "terreno",
    "administrador",
  );

  // El rol comercio solo ve sus locales vinculados; terreno y administrador
  // eligen entre todos los activos.
  let comercios: { id_comercio: number; nombre: string }[] = [];

  if (rol === "comercio") {
    const { data } = await supabase
      .from("usuarios_comercios")
      .select("id_comercio, comercios(nombre)")
      .eq("id_usuario", perfil.id_usuario);

    comercios = (data ?? [])
      .filter((r) => r.comercios !== null)
      .map((r) => ({
        id_comercio: r.id_comercio,
        nombre: r.comercios?.nombre ?? `#${r.id_comercio}`,
      }));
  } else {
    const { data } = await supabase
      .from("comercios")
      .select("id_comercio, nombre")
      .eq("activo", true)
      .order("nombre");

    comercios = data ?? [];
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl bg-background p-6">
      <Link
        href="/ingesta"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver a carga de precios
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Carga masiva por planilla</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Sube la planilla semanal de precios. Cada fila se valida por separado y los
        errores se informan por número de línea (US-C2).
      </p>

      <FormularioCsv comercios={comercios} />
    </main>
  );
}

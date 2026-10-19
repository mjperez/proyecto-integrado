import { requerirRol } from "@/lib/auth";
import { Contenedor, EncabezadoPagina } from "@/components/ui/pagina";
import { Panel, PanelCabecera } from "@/components/ui/panel";
import FormularioCsv from "./formulario";

export const metadata = { title: "Carga por planilla" };

const COLUMNAS = [
  { nombre: "nombre", detalle: "Nombre del producto tal como aparece en la planilla." },
  { nombre: "marca", detalle: "Marca comercial, o “sin marca” cuando no aplica." },
  { nombre: "formato", detalle: "Contenido neto, por ejemplo 1 kg o 900 ml." },
  { nombre: "precio", detalle: "Precio en pesos, con coma o punto decimal y sin separador de miles." },
];

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
    <Contenedor>
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Carga de precios", href: "/ingesta" },
          { etiqueta: "Planilla" },
        ]}
        eyebrow="Ingesta masiva · US-C2"
        titulo="Carga por planilla"
        descripcion="Sube la planilla semanal de precios. Cada fila se valida por separado y los errores se informan por número de línea, sin abortar el resto de la carga."
      />

      <div className="mt-8 grid gap-6 pb-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <FormularioCsv comercios={comercios} />

        <Panel className="lg:sticky lg:top-32">
          <PanelCabecera
            titulo="Formato esperado"
            descripcion="Cuatro columnas, con encabezado."
          />
          <div className="p-5">
            <ol className="flex flex-col gap-3">
              {COLUMNAS.map((c, i) => (
                <li key={c.nombre} className="flex gap-3">
                  <span className="cifra mt-0.5 text-[11px] font-bold text-pac-linea-fuerte">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-mono text-[12.5px] font-medium text-pac-azul">
                      {c.nombre}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-pac-tinta-suave">
                      {c.detalle}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <a
              href="/plantilla_precios.csv"
              className="mt-5 inline-flex h-9 w-full items-center justify-center border border-pac-azul/35 text-[11px] font-bold uppercase tracking-[0.09em] text-pac-azul transition-colors hover:border-pac-azul hover:bg-pac-azul-tenue"
            >
              Descargar plantilla
            </a>

            <p className="mt-4 border-t border-pac-linea pt-3 text-[11px] leading-relaxed text-pac-tinta-suave">
              Las filas con error no se cargan. El informe indica la línea y el
              motivo para corregir la planilla y volver a subirla.
            </p>
          </div>
        </Panel>
      </div>
    </Contenedor>
  );
}

import Link from "next/link";
import { ArrowRight, ClipboardList, Table2 } from "lucide-react";
import { requerirRol } from "@/lib/auth";
import { Contenedor, EncabezadoPagina } from "@/components/ui/pagina";
import { Etiqueta } from "@/components/ui/etiqueta";

export const metadata = { title: "Carga de precios" };

const OPCIONES = [
  {
    nombre: "Carga manual",
    href: "/mapa",
    desc: "Selecciona un comercio en el mapa y registra los precios uno por uno. Sirve para relevamientos puntuales o para corregir un valor.",
    detalle: "US-C1",
    icono: ClipboardList,
    nota: "Un producto a la vez, con fecha automática.",
  },
  {
    nombre: "Carga por planilla",
    href: "/ingesta/csv",
    desc: "Sube la planilla semanal en CSV. Cada fila se valida por separado y los errores se informan por número de línea.",
    detalle: "US-C2",
    icono: Table2,
    nota: "Carga masiva con informe de errores.",
  },
];

export default async function IngestaPage() {
  const { rol } = await requerirRol("comercio", "terreno", "administrador");

  return (
    <Contenedor>
      <EncabezadoPagina
        miga={[{ etiqueta: "Inicio", href: "/" }, { etiqueta: "Carga de precios" }]}
        titulo="Carga de precios"
        descripcion="Elige el método según el volumen: registro individual desde el mapa o planilla completa de la semana."
        acciones={<span className="micro text-pac-tinta-suave">Perfil {rol}</span>}
      />

      <div className="grid gap-px border border-pac-linea bg-pac-linea sm:grid-cols-2 mt-8 mb-14">
        {OPCIONES.map((o) => {
          const Icono = o.icono;
          return (
            <Link
              key={o.nombre}
              href={o.href}
              className="group relative flex flex-col bg-white p-6 transition-colors duration-150 hover:bg-pac-fondo/50"
            >
              <span className="absolute inset-x-0 top-0 h-[3px] bg-pac-rojo opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

              <div className="mb-6 flex items-start justify-between">
                <Icono
                  className="size-7 text-pac-azul"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <Etiqueta>{o.detalle}</Etiqueta>
              </div>

              <h2 className="text-[18px] font-bold text-pac-azul">{o.nombre}</h2>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-pac-tinta-suave">
                {o.desc}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-pac-linea pt-3">
                <span className="text-[11px] text-pac-tinta-suave">{o.nota}</span>
                <ArrowRight
                  className="size-4 text-pac-linea-fuerte transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-pac-rojo"
                  aria-hidden="true"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </Contenedor>
  );
}

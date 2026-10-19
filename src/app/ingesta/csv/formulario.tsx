"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";
import { cargarCsv } from "./acciones";
import type { ResultadoCarga } from "./acciones";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { Panel, PanelCabecera } from "@/components/ui/panel";

type Comercio = { id_comercio: number; nombre: string };

export default function FormularioCsv({ comercios }: { comercios: Comercio[] }) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoCarga | null,
    FormData
  >(cargarCsv, null);

  if (comercios.length === 0) {
    return (
      <Aviso tono="alerta" titulo="Sin comercios vinculados">
        Tu usuario no tiene comercios asociados. Pide al administrador que
        vincule uno antes de cargar precios.
      </Aviso>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel acento="azul">
        <PanelCabecera
          titulo="Subir planilla"
          descripcion="Formato CSV, separado por comas, con encabezado."
        />

        <form action={accion}>
          <div className="flex flex-col gap-4 p-5">
            <Campo etiqueta="Comercio" para="comercio" requerido>
              <Selector
                id="comercio"
                name="comercio"
                required
                defaultValue={comercios[0].id_comercio}
              >
                {comercios.map((c) => (
                  <option key={c.id_comercio} value={c.id_comercio}>
                    {c.nombre}
                  </option>
                ))}
              </Selector>
            </Campo>

            <div className="flex flex-col gap-1.5">
              <span className="micro text-pac-tinta-suave">
                Archivo<span className="ml-1 text-pac-rojo">*</span>
              </span>
              <label className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-pac-linea-fuerte bg-pac-fondo/40 px-4 py-8 text-center transition-colors hover:border-pac-azul hover:bg-pac-azul-tenue/40">
                <Upload className="size-6 text-pac-azul" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-[13px] font-medium text-pac-tinta">
                  Selecciona el archivo CSV
                </span>
                <span className="text-[11px] text-pac-tinta-suave">
                  Hasta 1 MB · columnas: nombre, marca, formato, precio
                </span>
                <input
                  type="file"
                  name="archivo"
                  accept=".csv,text/csv"
                  required
                  className="mt-1 w-full max-w-xs text-[12px] text-pac-tinta-suave file:mr-3 file:cursor-pointer file:border file:border-pac-azul/35 file:bg-white file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:uppercase file:tracking-[0.08em] file:text-pac-azul hover:file:bg-pac-azul-tenue"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end border-t border-pac-linea bg-pac-fondo/50 px-5 py-3.5">
            <Boton type="submit" disabled={pendiente}>
              {pendiente ? "Procesando…" : "Cargar planilla"}
            </Boton>
          </div>
        </form>
      </Panel>

      {estado && (
        <Aviso
          tono={estado.ok ? "exito" : "error"}
          titulo={estado.mensaje ?? undefined}
        >
          {estado.errores.length > 0 && (
            <ul className="mt-3 max-h-64 divide-y divide-black/5 overflow-y-auto border-t border-black/10">
              {estado.errores.map((e) => (
                <li
                  key={`${e.linea}-${e.mensaje}`}
                  className="flex gap-3 py-2 text-[12.5px]"
                >
                  <span className="cifra shrink-0 font-mono font-bold text-pac-rojo">
                    L{e.linea}
                  </span>
                  <span className="text-pac-tinta">{e.mensaje}</span>
                </li>
              ))}
            </ul>
          )}
        </Aviso>
      )}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { cargarCsv } from "./acciones";
import type { ResultadoCarga } from "./acciones";

type Comercio = { id_comercio: number; nombre: string };

const CAMPO =
  "w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export default function FormularioCsv({ comercios }: { comercios: Comercio[] }) {
  const [estado, accion, pendiente] = useActionState<ResultadoCarga | null, FormData>(
    cargarCsv,
    null,
  );

  if (comercios.length === 0) {
    return (
      <p className="rounded border border-pac-naranjo bg-pac-naranjo/10 p-3 text-sm text-pac-naranjo">
        No tienes comercios asociados a tu usuario. Pide al administrador que te
        vincule uno antes de cargar precios.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        action={accion}
        className="rounded-lg border border-border bg-card p-4"
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Comercio
            <select name="comercio" required defaultValue={comercios[0].id_comercio} className={CAMPO}>
              {comercios.map((c) => (
                <option key={c.id_comercio} value={c.id_comercio}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Planilla CSV
            <input
              type="file"
              name="archivo"
              accept=".csv,text/csv"
              required
              className="w-full rounded border border-input p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
            />
          </label>

          <p className="text-xs text-muted-foreground">
            Columnas: nombre, marca, formato, precio. Precio con coma o punto
            decimal y sin separador de miles.{" "}
            <a href="/plantilla_precios.csv" className="text-pac-celeste underline">
              Descargar plantilla
            </a>
            .
          </p>

          <button
            type="submit"
            disabled={pendiente}
            className="rounded bg-primary py-2 font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro disabled:opacity-60"
          >
            {pendiente ? "Procesando…" : "Cargar planilla"}
          </button>
        </div>
      </form>

      {estado && (
        <div
          className={`rounded border p-4 text-sm ${
            estado.ok
              ? "border-pac-verde bg-pac-verde/10 text-pac-verde"
              : "border-pac-rojo bg-pac-rojo/10 text-pac-rojo"
          }`}
        >
          <p className="font-semibold">{estado.mensaje}</p>

          {estado.errores.length > 0 && (
            <ul className="mt-2 max-h-64 list-disc overflow-y-auto pl-5">
              {estado.errores.map((e) => (
                <li key={`${e.linea}-${e.mensaje}`}>
                  Línea {e.linea}: {e.mensaje}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

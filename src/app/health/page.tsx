"use client";

import { useEffect, useState } from "react";
import { Contenedor } from "@/components/ui/pagina";
import { Etiqueta } from "@/components/ui/etiqueta";

// Espejo de la respuesta de /api/health. Los campos son opcionales porque el
// catch del fetch solo alcanza a devolver el estado.
type Estado = {
  status: "ok" | "degraded" | "error";
  servicios?: { base_datos: string };
  latencia_ms?: number;
  fecha?: string;
};

export default function Health() {
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((datos: Estado) => setEstado(datos))
      .catch(() => setEstado({ status: "error" }));
  }, []);

  if (!estado) {
    return (
      <Contenedor ancho="angosto">
        <p className="py-16 text-[13px] text-pac-tinta-suave" aria-busy="true">
          Consultando estado…
        </p>
      </Contenedor>
    );
  }

  const ok = estado.status === "ok";
  const datos = [
    ["Estado", estado.status],
    ["Base de datos", estado.servicios?.base_datos ?? "—"],
    ["Latencia", estado.latencia_ms !== undefined ? `${estado.latencia_ms} ms` : "—"],
    [
      "Consultado",
      estado.fecha
        ? new Date(estado.fecha).toLocaleString("es-CL")
        : new Date().toLocaleString("es-CL"),
    ],
  ];

  return (
    <Contenedor ancho="angosto">
      <div className="py-16">
        <Etiqueta className="mb-3 block">Diagnóstico</Etiqueta>
        <h1 className="flex items-center gap-3 text-[26px] font-bold text-pac-azul">
          <span
            className={`inline-block size-2.5 ${ok ? "bg-pac-verde" : "bg-pac-rojo"}`}
            aria-hidden="true"
          />
          {ok ? "Sistema operativo" : "Problemas detectados"}
        </h1>

        <dl className="mt-6 divide-y divide-pac-linea border-y border-pac-linea">
          {datos.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="micro text-pac-tinta-suave">{k}</dt>
              <dd className="cifra text-[13px] font-medium text-pac-tinta">{v}</dd>
            </div>
          ))}
        </dl>

        <pre className="mt-6 overflow-x-auto border border-pac-linea bg-pac-fondo p-4 font-mono text-[11px] leading-relaxed text-pac-tinta-suave">
          {JSON.stringify(estado, null, 2)}
        </pre>
      </div>
    </Contenedor>
  );
}

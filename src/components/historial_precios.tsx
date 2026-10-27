"use client";

import { useEffect, useState } from "react";
import { Panel, PanelCabecera } from "@/components/ui/panel";
import { Insignia } from "@/components/ui/etiqueta";
import type { PuntoHistorial } from "@/lib/comparador";

type Respuesta = {
  serie: PuntoHistorial[];
  variacion_pct: number | null;
  desde: string | null;
  hasta: string | null;
  dias: number;
};

const ANCHO = 640;
const ALTO = 150;
const MARGEN = { arriba: 12, abajo: 22, izquierda: 44, derecha: 12 };

function pesos(valor: number) {
  return `$${Math.round(valor).toLocaleString("es-CL")}`;
}

function fechaCorta(iso: string) {
  // La fecha viene como date (YYYY-MM-DD); se arma a mano para que no corra un
  // día por zona horaria al pasarla a Date.
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${String(anio).slice(2)}`;
}

/**
 * US-D2. Serie de precios del producto. El área muestra la banda entre el
 * comercio más barato y el más caro de cada fecha; la línea, el promedio.
 * Se dibuja a mano en SVG: una librería de gráficos para una sola serie no
 * se justifica y agrega peso a una PWA pensada para equipos de gama baja.
 */
export function HistorialPrecios({ idProducto }: { idProducto: number }) {
  // La respuesta se guarda con el id del producto al que pertenece. Así el
  // estado de carga se deriva: si el id no coincide con el pedido, todavía no
  // hay datos que mostrar y no se enseña la serie del producto anterior.
  const [datos, setDatos] = useState<(Respuesta & { idProducto: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    fetch(`/api/historial?producto=${idProducto}`)
      .then((res) => {
        if (!res.ok) throw new Error("respuesta no válida");
        return res.json() as Promise<Respuesta>;
      })
      .then((json) => {
        if (!cancelado) setDatos({ ...json, idProducto });
      })
      .catch(() => {
        if (cancelado) return;
        setError("No se pudo cargar el historial de este producto.");
        setDatos({
          idProducto,
          serie: [],
          variacion_pct: null,
          desde: null,
          hasta: null,
          dias: 0,
        });
      });

    return () => {
      cancelado = true;
    };
  }, [idProducto]);

  const cargando = datos?.idProducto !== idProducto;
  const serie = datos?.serie ?? [];
  const haySerie = serie.length >= 2;

  let contenido: React.ReactNode;

  if (cargando) {
    contenido = <div className="h-[150px] animate-pulse bg-pac-fondo" />;
  } else if (error) {
    contenido = (
      <p className="px-5 py-6 text-[13px] text-pac-tinta-suave">{error}</p>
    );
  } else if (!haySerie) {
    contenido = (
      <p className="px-5 py-6 text-[13px] leading-relaxed text-pac-tinta-suave">
        Todavía no hay suficientes registros para dibujar una tendencia. Se
        necesitan al menos dos fechas con precios cargados.
      </p>
    );
  } else {
    const valores = serie.flatMap((p) => [p.minimo, p.maximo]);
    const tope = Math.max(...valores);
    const piso = Math.min(...valores);
    const rango = tope - piso || 1;

    const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

    const x = (i: number) =>
      MARGEN.izquierda + (serie.length === 1 ? anchoUtil / 2 : (i / (serie.length - 1)) * anchoUtil);
    const y = (valor: number) =>
      MARGEN.arriba + altoUtil - ((valor - piso) / rango) * altoUtil;

    const linea = serie.map((p, i) => `${x(i)},${y(p.promedio)}`).join(" ");
    const banda = [
      ...serie.map((p, i) => `${x(i)},${y(p.maximo)}`),
      ...serie
        .map((p, i) => ({ p, i }))
        .reverse()
        .map(({ p, i }) => `${x(i)},${y(p.minimo)}`),
    ].join(" ");

    const ultimo = serie[serie.length - 1];
    const varPct = datos?.variacion_pct ?? null;

    contenido = (
      <>
        <div className="flex flex-wrap items-center gap-3 border-b border-pac-linea px-5 py-3">
          <span className="micro text-pac-tinta-suave">Variación</span>
          {varPct === null ? (
            <Insignia tono="neutro">Sin datos suficientes</Insignia>
          ) : (
            <span
              className={`cifra font-slab text-[18px] font-bold leading-none ${
                varPct > 0 ? "text-pac-rojo" : "text-pac-azul"
              }`}
            >
              {varPct > 0 ? "+" : ""}
              {varPct.toLocaleString("es-CL", { maximumFractionDigits: 1 })}%
            </span>
          )}
          <span className="text-[12px] text-pac-tinta-suave">
            {fechaCorta(serie[0].fecha)} a {fechaCorta(ultimo.fecha)}
          </span>
          <span className="ml-auto flex items-center gap-4 text-[11px] text-pac-tinta-suave">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-4 bg-pac-azul" />
              promedio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 bg-pac-azul/15" />
              banda mín–máx
            </span>
          </span>
        </div>

        <div className="px-2 py-3">
          <svg
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            className="h-[150px] w-full"
            role="img"
            aria-label={`Serie de precios entre ${fechaCorta(serie[0].fecha)} y ${fechaCorta(ultimo.fecha)}`}
          >
            {[tope, (tope + piso) / 2, piso].map((marca) => (
              <g key={marca}>
                <line
                  x1={MARGEN.izquierda}
                  x2={ANCHO - MARGEN.derecha}
                  y1={y(marca)}
                  y2={y(marca)}
                  stroke="#e6e6e6"
                  strokeWidth="1"
                />
                <text
                  x={MARGEN.izquierda - 6}
                  y={y(marca) + 3.5}
                  textAnchor="end"
                  className="fill-[#666] text-[10px]"
                >
                  {pesos(marca)}
                </text>
              </g>
            ))}

            <polygon points={banda} fill="#004283" fillOpacity="0.12" />
            <polyline
              points={linea}
              fill="none"
              stroke="#004283"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {serie.map((p, i) => (
              <circle
                key={p.fecha}
                cx={x(i)}
                cy={y(p.promedio)}
                r={i === serie.length - 1 ? 4 : 2}
                fill={i === serie.length - 1 ? "#c32e26" : "#004283"}
              />
            ))}

            <text
              x={MARGEN.izquierda}
              y={ALTO - 6}
              className="fill-[#666] text-[10px]"
              textAnchor="start"
            >
              {fechaCorta(serie[0].fecha)}
            </text>
            <text
              x={ANCHO - MARGEN.derecha}
              y={ALTO - 6}
              className="fill-[#666] text-[10px]"
              textAnchor="end"
            >
              {fechaCorta(ultimo.fecha)}
            </text>
          </svg>
        </div>

        <p className="border-t border-pac-linea px-5 py-3 text-[11px] leading-relaxed text-pac-tinta-suave">
          Cada punto promedia el precio vigente de los {ultimo.comercios} comercios
          que registraron este producto en esa fecha. Datos de prueba.
        </p>
      </>
    );
  }

  return (
    <Panel className="mt-6">
      <PanelCabecera
        titulo="Historial de precios"
        descripcion="Evolución del precio promedio entre los comercios de la comuna."
      />
      {contenido}
    </Panel>
  );
}

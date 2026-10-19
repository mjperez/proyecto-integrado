"use client";

import dynamic from "next/dynamic";
import { BarraSuperior } from "@/components/shell/barra_superior";

const MapaComercios = dynamic(() => import("@/components/mapa_comercios"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-pac-fondo" aria-busy="true">
      <p className="micro text-pac-tinta-suave">Cargando mapa…</p>
    </div>
  ),
});

export default function MapaPage() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <BarraSuperior fija />
      <main className="flex min-h-0 flex-1 flex-col">
        <MapaComercios />
      </main>
    </div>
  );
}

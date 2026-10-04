"use client";

import dynamic from "next/dynamic";

const MapaComercios = dynamic(() => import("@/components/mapa_comercios"), {
    ssr: false,
    loading: () => <p className="p-6 text-sm text-gray-500">Cargando mapa…</p>,
});

export default function MapaPage() {
    return (
        <main className="flex h-screen w-full flex-col">
            <header className="flex items-center justify-between border-b p-4">
                <h1 className="text-xl font-bold">Mapa de Comercios</h1>
                <a href="/" className="text-sm text-[#004283] underline">
                    ← Volver
                </a>
            </header>
            <div className="flex min-h-0 flex-1 flex-col">
                <MapaComercios />
            </div>
        </main>
    );
}
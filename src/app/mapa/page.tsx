"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth_provider";

const MapaComercios = dynamic(() => import("@/components/mapa_comercios"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted-foreground">Cargando mapa…</p>,
});

export default function MapaPage() {
  const { sesion, perfil, salir } = useAuth();
  const router = useRouter();

  async function cerrarSesion() {
    await salir();
    router.push("/login");
  }

  return (
    <main className="flex h-screen w-full flex-col">
      <header className="flex items-center justify-between bg-pac-azul-oscuro px-4 py-3 text-primary-foreground">
        <h1 className="text-lg font-bold">Observatorio Comunal de Precios</h1>

        {!sesion ? (
          <a href="/login" className="text-sm underline">
            Ingresar
          </a>
        ) : (
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded bg-primary-foreground/10 px-3 py-1.5 text-sm">
              {perfil?.rol?.nombre ?? "…"} <span className="text-xs">▼</span>
            </summary>
            <div className="absolute right-0 z-[1001] mt-2 w-60 rounded border bg-card p-3 text-sm text-card-foreground shadow-lg">
              <p className="font-semibold">{perfil ? "Sesión activa" : "Sin perfil"}</p>
              <p className="text-muted-foreground">{sesion.user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Rol: {perfil?.rol?.nombre ?? "sin asignar"}
              </p>
              <Link href="/" className="mt-3 block text-primary underline">
                ← Volver al inicio
              </Link>
              <button
                onClick={cerrarSesion}
                className="mt-2 w-full rounded bg-pac-rojo px-3 py-1.5 text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
              >
                Cerrar sesión
              </button>
            </div>
          </details>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <MapaComercios />
      </div>
    </main>
  );
}
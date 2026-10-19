"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth_provider";
import { Insignia } from "@/components/ui/etiqueta";

const ETIQUETA_ROL: Record<string, string> = {
  administrador: "Administración",
  comercio: "Comercio",
  terreno: "Terreno",
  ciudadano: "Ciudadanía",
};

export function MenuUsuario({ email, rol }: { email: string; rol?: string }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const { salir } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!abierto) return;

    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  const inicial = (rol ?? email).slice(0, 1).toUpperCase();

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-2 border border-white/35 pl-1 pr-2 text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
      >
        <span className="grid size-7 place-items-center bg-white/15 text-[11px] font-bold">
          {inicial}
        </span>
        <span className="hidden text-[12px] font-bold uppercase tracking-[0.08em] sm:inline">
          {ETIQUETA_ROL[rol ?? ""] ?? "Mi cuenta"}
        </span>
        <ChevronDown className="size-3.5 opacity-70" aria-hidden="true" />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-64 border border-pac-linea bg-white"
        >
          <div className="border-b border-pac-linea px-4 py-3">
            <p className="micro mb-1.5 text-pac-tinta-suave">Sesión activa</p>
            <p className="truncate text-[13px] font-medium text-pac-tinta">{email}</p>
            <div className="mt-2">
              <Insignia tono={rol ? "neutro" : "destacado"}>
                {rol ? ETIQUETA_ROL[rol] ?? rol : "Sin rol asignado"}
              </Insignia>
            </div>
          </div>

          <div className="flex flex-col py-1">
            <Link
              href="/dashboard"
              onClick={() => setAbierto(false)}
              className="px-4 py-2.5 text-[13px] text-pac-tinta transition-colors hover:bg-pac-fondo"
            >
              Mi panel
            </Link>
            <Link
              href="/"
              onClick={() => setAbierto(false)}
              className="px-4 py-2.5 text-[13px] text-pac-tinta transition-colors hover:bg-pac-fondo"
            >
              Portada pública
            </Link>
          </div>

          <button
            type="button"
            onClick={async () => {
              await salir();
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-2 border-t border-pac-linea px-4 py-2.5 text-left text-[13px] font-medium text-pac-rojo transition-colors hover:bg-pac-rojo-tenue"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

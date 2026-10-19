"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth_provider";
import { MenuUsuario } from "@/components/shell/menu_usuario";
import { cn } from "@/lib/utils";

type Enlace = { href: string; etiqueta: string; soloRol?: string[] };

const ENLACES: Enlace[] = [
  { href: "/mapa", etiqueta: "Mapa" },
  { href: "/comparador", etiqueta: "Comparador" },
  {
    href: "/ingesta",
    etiqueta: "Cargar precios",
    soloRol: ["comercio", "terreno", "administrador"],
  },
  { href: "/admin", etiqueta: "Mantenedores", soloRol: ["administrador"] },
];

export function BarraSuperior({ fija = false }: { fija?: boolean }) {
  const { perfil, sesion } = useAuth();
  const ruta = usePathname();
  const rol = perfil?.roles?.nombre;

  const visibles = ENLACES.filter(
    (e) => !e.soloRol || (rol && e.soloRol.includes(rol)),
  );

  const activo = (href: string) =>
    ruta === href || (href !== "/" && ruta.startsWith(`${href}/`));

  return (
    <header className={cn("z-40", fija && "sticky top-0")}>
      {/* Filete rojo: la marca de la casa abre cada página. */}
      <div className="h-[3px] bg-pac-rojo" />

      <div className="bg-pac-azul">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-3"
              aria-label="Observatorio Comunal de Precios, inicio"
            >
              <span className="grid size-10 shrink-0 place-items-center bg-white font-slab text-[13px] font-bold leading-none tracking-tight text-pac-azul">
                PAC
              </span>
              <span className="hidden min-w-0 flex-col sm:flex">
                <span className="text-[9px] font-medium uppercase leading-none tracking-[0.18em] text-white/55">
                  Municipalidad de
                </span>
                <span className="mt-1 font-slab text-[15px] font-bold leading-none text-white">
                  Pedro Aguirre Cerda
                </span>
              </span>
            </Link>

            <nav
              aria-label="Principal"
              className="ml-auto hidden items-center gap-1 md:flex"
            >
              {visibles.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  aria-current={activo(e.href) ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 items-center px-3 text-[13px] font-medium transition-colors duration-150",
                    activo(e.href)
                      ? "text-white"
                      : "text-white/70 hover:text-white",
                  )}
                >
                  {e.etiqueta}
                  <span
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-[3px] bg-pac-rojo transition-opacity duration-150",
                      activo(e.href) ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Link>
              ))}
            </nav>

            <div className="ml-auto md:ml-2">
              {sesion ? (
                <MenuUsuario email={sesion.user.email ?? ""} rol={rol} />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center border border-white/35 px-4 text-[12px] font-bold uppercase tracking-[0.09em] text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
                >
                  Ingresar
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* En móvil la navegación baja a una segunda línea desplazable. */}
        <nav
          aria-label="Principal móvil"
          className="mx-auto flex w-full max-w-6xl items-center gap-5 overflow-x-auto border-t border-white/15 px-5 md:hidden"
        >
          {visibles.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              aria-current={activo(e.href) ? "page" : undefined}
              className={cn(
                "flex h-11 shrink-0 items-center border-b-[3px] text-[12px] font-bold uppercase tracking-[0.08em] transition-colors",
                activo(e.href)
                  ? "border-pac-rojo text-white"
                  : "border-transparent text-white/65",
              )}
            >
              {e.etiqueta}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

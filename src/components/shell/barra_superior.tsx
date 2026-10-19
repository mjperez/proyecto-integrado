"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth_provider";
import { MenuUsuario } from "@/components/shell/menu_usuario";
import { cn } from "@/lib/utils";

type Enlace = { href: string; etiqueta: string; soloRol?: string[] };

const ENLACES: Enlace[] = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/mapa", etiqueta: "Mapa" },
  { href: "/comparador", etiqueta: "Comparador" },
  {
    href: "/ingesta",
    etiqueta: "Carga de precios",
    soloRol: ["comercio", "terreno", "administrador"],
  },
  { href: "/admin", etiqueta: "Mantenedores", soloRol: ["administrador"] },
];

export function BarraSuperior({
  fija = false,
  nota,
}: {
  fija?: boolean;
  nota?: string;
}) {
  const { perfil, sesion } = useAuth();
  const ruta = usePathname();
  const rol = perfil?.roles?.nombre;

  const visibles = ENLACES.filter(
    (e) => !e.soloRol || (rol && e.soloRol.includes(rol)),
  );

  const activo = (href: string) =>
    href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

  return (
    <header className={cn("z-40", fija && "sticky top-0")}>
      {/* Franja superior: en el sitio del municipio aloja trámites y enlaces
          de transparencia. Aquí lleva el acceso directo y la fecha del dato. */}
      <div className="bg-pac-azul-profundo">
        <div className="mx-auto flex h-10 w-full max-w-6xl items-center gap-4 px-5 sm:px-8">
          <Link
            href="/comparador"
            className="hidden h-[26px] items-center bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-pac-azul transition-colors hover:bg-pac-azul-tenue sm:inline-flex"
          >
            Buscar un precio
          </Link>
          <p className="truncate text-[11px] text-white/55">
            {nota ?? "Observatorio Comunal de Precios"}
          </p>
          <Link
            href="/login"
            className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-white/70 transition-colors hover:text-white"
          >
            Acceso funcionario
          </Link>
        </div>
      </div>

      {/* Barra principal azul, con el escudo municipal. */}
      <div className="bg-pac-azul">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="flex h-[72px] items-center gap-3">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5"
              aria-label="Observatorio Comunal de Precios, inicio"
            >
              <Image
                src="/escudo_pac.png"
                alt="Escudo de la Municipalidad de Pedro Aguirre Cerda"
                width={52}
                height={52}
                priority
                className="size-[52px] object-contain"
              />
              <span className="hidden flex-col sm:flex">
                <span className="text-[8px] font-medium uppercase leading-none tracking-[0.2em] text-white/55">
                  Municipalidad
                </span>
                <span className="mt-1 text-[15px] font-bold leading-none text-white">
                  Pedro Aguirre Cerda
                </span>
              </span>
            </Link>

            <nav aria-label="Principal" className="ml-4 hidden items-center md:flex">
              {visibles.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  aria-current={activo(e.href) ? "page" : undefined}
                  className={cn(
                    "relative flex h-[72px] items-center px-3 text-[14px] transition-colors duration-150",
                    activo(e.href)
                      ? "text-white"
                      : "text-white/75 hover:text-white",
                  )}
                >
                  {e.etiqueta}
                  <span
                    className={cn(
                      "absolute inset-x-2 bottom-0 h-[3px] bg-pac-rojo transition-opacity duration-150",
                      activo(e.href) ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Link>
              ))}
            </nav>

            <div className="ml-auto">
              {sesion ? (
                <MenuUsuario email={sesion.user.email ?? ""} rol={rol} />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center border border-white/40 px-4 text-[11px] font-bold uppercase tracking-[0.09em] text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
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
                "flex h-11 shrink-0 items-center border-b-[3px] text-[12px] font-bold uppercase tracking-[0.06em] transition-colors",
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MODULOS = [
  { href: "/admin", etiqueta: "Resumen", exacto: true },
  { href: "/admin/productos", etiqueta: "Productos" },
  { href: "/admin/categorias", etiqueta: "Categorías" },
  { href: "/admin/comercios", etiqueta: "Comercios" },
  { href: "/admin/aliases", etiqueta: "Aliases" },
  { href: "/admin/auditoria", etiqueta: "Auditoría" },
];

/** Franja de módulos del panel: la misma lógica de subrayado que la barra. */
export function NavModulos() {
  const ruta = usePathname();

  return (
    <div className="border-b border-pac-linea bg-white">
      <nav
        aria-label="Módulos del panel"
        className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-5 sm:px-8"
      >
        {MODULOS.map((m) => {
          const activo = m.exacto
            ? ruta === m.href
            : ruta === m.href || ruta.startsWith(`${m.href}/`);

          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex h-12 shrink-0 items-center border-b-[3px] px-3 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors duration-150",
                activo
                  ? "border-pac-rojo text-pac-azul"
                  : "border-transparent text-pac-tinta-suave hover:border-pac-linea-fuerte hover:text-pac-azul",
              )}
            >
              {m.etiqueta}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

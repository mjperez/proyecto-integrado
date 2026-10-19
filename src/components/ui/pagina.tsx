import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Etiqueta } from "@/components/ui/etiqueta";

export function Contenedor({
  children,
  className,
  ancho = "normal",
}: {
  children: React.ReactNode;
  className?: string;
  ancho?: "angosto" | "normal" | "amplio";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8",
        ancho === "angosto" && "max-w-2xl",
        ancho === "normal" && "max-w-5xl",
        ancho === "amplio" && "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

type Miga = { etiqueta: string; href?: string };

export function EncabezadoPagina({
  miga,
  eyebrow,
  titulo,
  descripcion,
  acciones,
  className,
}: {
  miga?: Miga[];
  eyebrow?: string;
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-pac-linea pb-6 pt-8", className)}>
      {miga && miga.length > 0 && (
        <nav aria-label="Ruta" className="mb-4 flex flex-wrap items-center gap-1.5">
          {miga.map((m, i) => (
            <span key={`${m.etiqueta}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="size-3 text-pac-linea-fuerte" aria-hidden="true" />
              )}
              {m.href ? (
                <Link
                  href={m.href}
                  className="text-[12px] font-medium text-pac-tinta-suave transition-colors hover:text-pac-azul"
                >
                  {m.etiqueta}
                </Link>
              ) : (
                <span className="text-[12px] font-medium text-pac-tinta">
                  {m.etiqueta}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && <Etiqueta className="mb-2 block">{eyebrow}</Etiqueta>}
          <h1 className="text-[clamp(1.75rem,3.2vw,2.4rem)] font-bold leading-[1.1] text-pac-azul">
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-2 text-[15px] leading-relaxed text-pac-tinta-suave">
              {descripcion}
            </p>
          )}
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </header>
  );
}

/** Estado vacío con una salida concreta, no un "no hay datos" a secas. */
export function EstadoVacio({
  titulo,
  descripcion,
  accion,
  className,
}: {
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 border border-dashed border-pac-linea-fuerte bg-pac-fondo/40 px-5 py-8",
        className,
      )}
    >
      <p className="font-slab text-[16px] font-bold text-pac-azul">{titulo}</p>
      <p className="max-w-md text-[14px] leading-relaxed text-pac-tinta-suave">
        {descripcion}
      </p>
      {accion}
    </div>
  );
}

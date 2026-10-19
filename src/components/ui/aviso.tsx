import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Tono = "error" | "alerta" | "exito" | "info";

/**
 * Aviso. El color semántico va en el borde izquierdo y en el icono; el texto
 * queda siempre en tinta oscura sobre un tinte claro. Así el mensaje conserva
 * contraste suficiente sin depender de tonos que no alcanzan 4.5:1.
 */
const TONOS: Record<
  Tono,
  { borde: string; fondo: string; icono: React.ElementType; colorIcono: string }
> = {
  error: {
    borde: "border-l-pac-rojo",
    fondo: "bg-pac-rojo-tenue",
    icono: CircleAlert,
    colorIcono: "text-pac-rojo",
  },
  alerta: {
    borde: "border-l-pac-naranjo",
    fondo: "bg-[#fdf1ec]",
    icono: TriangleAlert,
    colorIcono: "text-[#b4471c]",
  },
  exito: {
    borde: "border-l-pac-verde",
    fondo: "bg-[#f4f8e4]",
    icono: CircleCheck,
    colorIcono: "text-[#5c7a10]",
  },
  info: {
    borde: "border-l-pac-celeste",
    fondo: "bg-[#e9f6fb]",
    icono: Info,
    colorIcono: "text-pac-azul",
  },
};

export function Aviso({
  tono = "info",
  titulo,
  children,
  className,
}: {
  tono?: Tono;
  titulo?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const t = TONOS[tono];
  const Icono = t.icono;

  return (
    <div
      role={tono === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 border border-pac-linea border-l-[3px] px-3.5 py-3",
        t.borde,
        t.fondo,
        className,
      )}
    >
      <Icono className={cn("mt-0.5 size-4 shrink-0", t.colorIcono)} aria-hidden="true" />
      <div className="min-w-0 text-[14px] leading-relaxed text-pac-tinta">
        {titulo && <p className="font-bold">{titulo}</p>}
        {children}
      </div>
    </div>
  );
}

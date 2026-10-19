import { cn } from "@/lib/utils";

/**
 * Superficie de contenido. Plana: borde de un pixel, sin radio ni sombra.
 * El acento superior es opcional y sirve para separar bloques que compiten.
 */
export function Panel({
  children,
  className,
  acento,
}: {
  children: React.ReactNode;
  className?: string;
  acento?: "azul" | "rojo" | "ninguno";
}) {
  return (
    <section
      className={cn(
        "border border-pac-linea bg-white",
        acento === "azul" && "border-t-[3px] border-t-pac-azul",
        acento === "rojo" && "border-t-[3px] border-t-pac-rojo",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelCabecera({
  titulo,
  descripcion,
  accion,
  className,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-pac-linea px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold text-pac-azul">{titulo}</h2>
        {descripcion && (
          <p className="mt-0.5 text-[13px] leading-snug text-pac-tinta-suave">
            {descripcion}
          </p>
        )}
      </div>
      {accion}
    </header>
  );
}

/** Cifra grande para tableros: slab, tabular, azul institucional. */
export function Cifra({
  valor,
  rotulo,
  className,
  invertida,
}: {
  valor: string | number;
  rotulo: string;
  className?: string;
  invertida?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={cn(
          "cifra font-slab text-[34px] font-bold leading-none tracking-tight",
          invertida ? "text-white" : "text-pac-azul",
        )}
      >
        {typeof valor === "number" ? valor.toLocaleString("es-CL") : valor}
      </span>
      <span
        className={cn(
          "micro",
          invertida ? "text-white/60" : "text-pac-tinta-suave",
        )}
      >
        {rotulo}
      </span>
    </div>
  );
}

import { cn } from "@/lib/utils";

/** Rótulo de sección: mayúscula, rojo, con aire entre letras. */
export function Etiqueta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("micro text-pac-rojo", className)}>{children}</span>;
}

type Tono = "activo" | "inactivo" | "destacado" | "neutro";

const TONOS: Record<Tono, string> = {
  // Sólido sobre sólido: la lima solo se usa como relleno con tinta encima,
  // nunca como color de texto sobre blanco (contraste 1.9:1).
  activo: "bg-pac-verde text-pac-azul-profundo",
  inactivo: "bg-pac-fondo text-pac-tinta-suave",
  destacado: "bg-pac-rojo text-white",
  neutro: "bg-pac-azul-tenue text-pac-azul",
};

export function Insignia({
  children,
  tono = "neutro",
  className,
}: {
  children: React.ReactNode;
  tono?: Tono;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.1em]",
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botón institucional. La caja es de 6px, el rótulo va en mayúscula con aire
 * entre letras y el borde es de un pixel, igual que los botones del sitio del
 * municipio. No hay sombras ni degradados: el color plano es la señal.
 */
const boton = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md border",
    "text-[12px] font-bold uppercase tracking-[0.09em] leading-none",
    "transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-40",
    "whitespace-nowrap select-none",
  ].join(" "),
  {
    variants: {
      variante: {
        primario:
          "border-pac-rojo bg-pac-rojo text-white hover:bg-pac-rojo-oscuro hover:border-pac-rojo-oscuro",
        institucional:
          "border-pac-azul bg-pac-azul text-white hover:bg-pac-azul-profundo hover:border-pac-azul-profundo",
        contorno:
          "border-pac-azul/35 bg-transparent text-pac-azul hover:border-pac-azul hover:bg-pac-azul-tenue",
        fantasma:
          "border-transparent bg-transparent text-pac-azul hover:bg-pac-fondo",
        peligro:
          "border-pac-rojo/35 bg-transparent text-pac-rojo hover:border-pac-rojo hover:bg-pac-rojo-tenue",
        claro:
          "border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/60",
      },
      tamano: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6",
      },
      bloque: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variante: "primario",
      tamano: "md",
      bloque: false,
    },
  },
);

type Props = VariantProps<typeof boton> & {
  className?: string;
  children: React.ReactNode;
};

export function Boton({
  variante,
  tamano,
  bloque,
  className,
  children,
  ...resto
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(boton({ variante, tamano, bloque }), className)} {...resto}>
      {children}
    </button>
  );
}

export function BotonEnlace({
  variante,
  tamano,
  bloque,
  className,
  children,
  href,
  ...resto
}: Props & { href: string } & Omit<
    React.ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >) {
  return (
    <Link
      href={href}
      className={cn(boton({ variante, tamano, bloque }), className)}
      {...resto}
    >
      {children}
    </Link>
  );
}

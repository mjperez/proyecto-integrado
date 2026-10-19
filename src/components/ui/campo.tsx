import { cn } from "@/lib/utils";

const BASE =
  "w-full rounded-md border border-pac-linea-fuerte bg-white px-3 text-[15px] text-pac-tinta " +
  "placeholder:text-pac-tinta-suave/70 transition-colors duration-150 " +
  "hover:border-pac-tinta-suave/60 " +
  "focus:border-pac-azul focus:outline-none focus:ring-2 focus:ring-pac-azul/15 " +
  "disabled:bg-pac-fondo disabled:text-pac-tinta-suave";

/** Envoltura de campo: rótulo, control y ayuda. */
export function Campo({
  etiqueta,
  para,
  ayuda,
  error,
  requerido,
  className,
  children,
}: {
  etiqueta: string;
  para?: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={para} className="micro text-pac-tinta-suave">
        {etiqueta}
        {requerido && (
          <span className="ml-1 text-pac-rojo" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-pac-rojo">{error}</p>
      ) : ayuda ? (
        <p className="text-[12px] leading-snug text-pac-tinta-suave">{ayuda}</p>
      ) : null}
    </div>
  );
}

export function Entrada({
  className,
  ...resto
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(BASE, "h-10", className)} {...resto} />;
}

export function Selector({
  className,
  children,
  ...resto
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(BASE, "h-10 cursor-pointer select-flecha", className)}
      {...resto}
    >
      {children}
    </select>
  );
}

export function AreaTexto({
  className,
  ...resto
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(BASE, "min-h-24 py-2", className)} {...resto} />;
}

export function Casilla({
  etiqueta,
  className,
  ...resto
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        "flex w-fit cursor-pointer items-center gap-2.5 text-[14px] text-pac-tinta",
        className,
      )}
    >
      <input
        type="checkbox"
        className="size-4 cursor-pointer accent-pac-rojo"
        {...resto}
      />
      {etiqueta}
    </label>
  );
}

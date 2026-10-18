import Link from "next/link";
import { requerirRol } from "@/lib/auth";

export default async function IngestaPage() {
  const { rol } = await requerirRol("comercio", "terreno", "administrador");

  const opciones = [
    {
      nombre: "Carga manual",
      href: "/mapa",
      desc: "Selecciona un comercio en el mapa y registra los precios uno por uno.",
      detalle: "US-C1",
    },
    {
      nombre: "Carga por planilla",
      href: "/ingesta/csv",
      desc: "Sube un CSV semanal. Se valida fila por fila y se informan los errores por línea.",
      detalle: "US-C2",
    },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl bg-background p-6">
      <Link href="/" className="text-sm text-pac-celeste transition-colors hover:underline">
        ← Volver al inicio
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Carga de precios</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Sesión con perfil <span className="font-medium">{rol}</span>. Elige cómo
        quieres registrar los precios.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {opciones.map((o) => (
          <Link
            key={o.nombre}
            href={o.href}
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-pac-celeste"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-pac-azul">{o.nombre}</h2>
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {o.detalle}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{o.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

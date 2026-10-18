import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import BotonSalir from "@/components/boton_salir";

type Modulo = {
  nombre: string;
  total: number;
  desc: string;
  href: string | null;
};

export default async function AdminPage() {
  const supabase = await createClient();

  const [categorias, productos, comercios, aliases, auditoria] = await Promise.all([
    supabase.from("categorias").select("*", { count: "exact", head: true }),
    supabase.from("productos").select("*", { count: "exact", head: true }),
    supabase.from("comercios").select("*", { count: "exact", head: true }),
    supabase.from("aliases").select("*", { count: "exact", head: true }),
    supabase.from("registros_auditoria").select("*", { count: "exact", head: true }),
  ]);

  const modulos: Modulo[] = [
    {
      nombre: "Categorías",
      total: categorias.count ?? 0,
      desc: "Clasificación maestra de productos.",
      href: "/admin/categorias",
    },
    {
      nombre: "Productos",
      total: productos.count ?? 0,
      desc: "Catálogo de productos y marcas.",
      href: "/admin/productos",
    },
    {
      nombre: "Comercios",
      total: comercios.count ?? 0,
      desc: "Locales y puntos de venta.",
      href: "/admin/comercios",
    },
    {
      nombre: "Aliases",
      total: aliases.count ?? 0,
      desc: "Sinónimos para normalizar nombres.",
      href: "/admin/aliases",
    },
    {
      nombre: "Auditoría",
      total: auditoria.count ?? 0,
      desc: "Registro inmutable de cambios.",
      href: "/admin/auditoria",
    },
  ];

  return (
    <main className="min-h-screen bg-pac-gris p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-wide text-pac-celeste">
            Panel de administración
          </p>
          <BotonSalir />
        </div>
        <h1 className="mt-2 text-3xl font-bold text-pac-azul">
          Observatorio Comunal de Precios
        </h1>
        <p className="mt-1 text-muted-foreground">
          Mantenedores del catálogo maestro (Sprint 1).
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modulos.map((m) => {
            const tarjeta = (
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-pac-azul">{m.nombre}</h2>
                  <span className="text-sm text-muted-foreground">{m.total}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
                {!m.href && (
                  <p className="mt-3 text-xs font-medium text-pac-naranjo">Próximamente</p>
                )}
              </div>
            );

            return m.href ? (
              <Link
                key={m.nombre}
                href={m.href}
                className="transition-transform hover:-translate-y-0.5"
              >
                {tarjeta}
              </Link>
            ) : (
              <div key={m.nombre} className="opacity-80">
                {tarjeta}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/mapa"
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
          >
            Ver mapa
          </Link>
          <Link
            href="/comparador"
            className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Comparador de precios
          </Link>
          <Link
            href="/dashboard"
            className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

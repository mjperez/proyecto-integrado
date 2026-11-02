import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { Contenedor, EncabezadoPagina } from "@/components/ui/pagina";
import { Cifra } from "@/components/ui/panel";

type Modulo = {
  nombre: string;
  total: number;
  desc: string;
  href: string;
};

export const metadata = { title: "Panel de mantenedores" };

export default async function AdminPage() {
  const supabase = await createClient();

  const [categorias, productos, comercios, aliases, auditoria] =
    await Promise.all([
      supabase.from("categorias").select("*", { count: "exact", head: true }),
      supabase.from("productos").select("*", { count: "exact", head: true }),
      supabase.from("comercios").select("*", { count: "exact", head: true }),
      supabase.from("aliases").select("*", { count: "exact", head: true }),
      supabase
        .from("registros_auditoria")
        .select("*", { count: "exact", head: true }),
    ]);

  const modulos: Modulo[] = [
    {
      nombre: "Productos",
      total: productos.count ?? 0,
      desc: "Catálogo maestro con marca, formato y unidad canónicos.",
      href: "/admin/productos",
    },
    {
      nombre: "Categorías",
      total: categorias.count ?? 0,
      desc: "Clasificación de nivel superior del catálogo.",
      href: "/admin/categorias",
    },
    {
      nombre: "Comercios",
      total: comercios.count ?? 0,
      desc: "Matrices y sucursales con coordenadas dentro de la comuna.",
      href: "/admin/comercios",
    },
    {
      nombre: "Aliases",
      total: aliases.count ?? 0,
      desc: "Sinónimos del habla local que resuelven contra el catálogo.",
      href: "/admin/aliases",
    },
    {
      nombre: "Auditoría",
      total: auditoria.count ?? 0,
      desc: "Registro inmutable encadenado por hash.",
      href: "/admin/auditoria",
    },
  ];

  return (
    <Contenedor>
      <EncabezadoPagina
        miga={[{ etiqueta: "Inicio", href: "/" }, { etiqueta: "Panel" }]}
        eyebrow="Administración"
        titulo="Panel de mantenedores"
        descripcion="Estado del catálogo maestro y acceso a cada módulo de gestión."
      />

      <section
        aria-label="Indicadores"
        className="mt-8 grid grid-cols-2 gap-px border border-pac-linea bg-pac-linea sm:grid-cols-3 lg:grid-cols-5"
      >
        {modulos.map((m) => (
          <div key={m.nombre} className="bg-white px-4 py-4">
            <Cifra valor={m.total} rotulo={m.nombre} />
          </div>
        ))}
      </section>

      <section className="mt-8 pb-14">
        <h2 className="mb-3 text-[15px] font-bold text-pac-tinta">
          Módulos de gestión
        </h2>

        <ul className="divide-y divide-pac-linea border-y border-pac-linea bg-white">
          {modulos.map((m) => (
            <li key={m.nombre}>
              <Link
                href={m.href}
                className="group flex items-center gap-4 px-4 py-4 transition-colors duration-150 hover:bg-pac-fondo/60"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14.5px] font-bold text-pac-tinta">
                    {m.nombre}
                  </h3>
                  <p className="mt-0.5 text-[13px] leading-snug text-pac-tinta-suave">
                    {m.desc}
                  </p>
                </div>

                <span className="cifra hidden shrink-0 font-slab text-[17px] font-bold text-pac-azul sm:block">
                  {m.total}
                </span>

                <ArrowUpRight
                  className="size-4 shrink-0 text-pac-linea-fuerte transition-colors duration-150 group-hover:text-pac-rojo"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[12px] leading-relaxed text-pac-tinta-suave">
          Cada alta, modificación o baja queda registrada en la cadena de
          auditoría y no se puede alterar sin dejar rastro.
        </p>
      </section>
    </Contenedor>
  );
}

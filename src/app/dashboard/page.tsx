import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { BarraSuperior } from "@/components/shell/barra_superior";
import { Pie } from "@/components/shell/pie";
import { Contenedor, EncabezadoPagina } from "@/components/ui/pagina";
import { Cifra } from "@/components/ui/panel";
import { Insignia } from "@/components/ui/etiqueta";

export const metadata = { title: "Mi panel" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const [{ data: perfil }, productos, comercios, precios] = await Promise.all([
    supabase
      .from("usuarios")
      .select("nombre, roles(nombre)")
      .eq("auth_uid", user.id)
      .maybeSingle(),
    supabase
      .from("productos")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase
      .from("comercios")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase.from("precios").select("*", { count: "exact", head: true }),
  ]);

  const rol = perfil?.roles?.nombre;
  const puedeCargar =
    rol === "comercio" || rol === "terreno" || rol === "administrador";
  const esAdmin = rol === "administrador";

  const accesos = [
    { href: "/mapa", titulo: "Mapa de comercios", desc: "Precios vigentes por local." },
    {
      href: "/comparador",
      titulo: "Comparador",
      desc: "Un producto, todos los comercios.",
    },
    ...(puedeCargar
      ? [
          {
            href: "/ingesta",
            titulo: "Carga de precios",
            desc: "Registro manual o planilla semanal.",
          },
        ]
      : []),
    ...(esAdmin
      ? [
          {
            href: "/admin",
            titulo: "Mantenedores",
            desc: "Catálogo, comercios y auditoría.",
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <BarraSuperior fija />

      <main className="flex-1">
        <Contenedor>
          <EncabezadoPagina
            miga={[{ etiqueta: "Inicio", href: "/" }, { etiqueta: "Mi panel" }]}
            eyebrow="Sesión activa"
            titulo={perfil?.nombre ? `Hola, ${perfil.nombre}` : "Mi panel"}
            descripcion={user.email ?? ""}
            acciones={
              <Insignia tono={rol ? "neutro" : "destacado"}>
                {rol ?? "Sin rol asignado"}
              </Insignia>
            }
          />

          {!perfil && (
            <p className="mt-6 border-l-[3px] border-l-pac-naranjo bg-[#fdf1ec] px-3.5 py-3 text-[13px] leading-relaxed text-pac-tinta">
              Tu cuenta existe en el sistema de acceso pero no tiene fila en la
              tabla de usuarios, así que no tiene rol asignado. Pide al
              administrador que la vincule.
            </p>
          )}

          <section
            aria-label="Estado del observatorio"
            className="mt-8 grid grid-cols-3 gap-px border border-pac-linea bg-pac-linea"
          >
            <div className="bg-white px-4 py-4">
              <Cifra valor={productos.count ?? 0} rotulo="Productos activos" />
            </div>
            <div className="bg-white px-4 py-4">
              <Cifra valor={comercios.count ?? 0} rotulo="Comercios activos" />
            </div>
            <div className="bg-white px-4 py-4">
              <Cifra valor={precios.count ?? 0} rotulo="Precios registrados" />
            </div>
          </section>

          <section className="mt-8 pb-14">
            <h2 className="mb-3 text-[15px] font-bold text-pac-tinta">
              Accesos disponibles
            </h2>

            <ul className="grid gap-px border border-pac-linea bg-pac-linea sm:grid-cols-2">
              {accesos.map((a) => (
                <li key={a.href} className="bg-white">
                  <Link
                    href={a.href}
                    className="group flex items-start gap-3 px-4 py-4 transition-colors duration-150 hover:bg-pac-fondo/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-pac-tinta">
                        {a.titulo}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-pac-tinta-suave">
                        {a.desc}
                      </p>
                    </div>
                    <ArrowUpRight
                      className="mt-0.5 size-4 shrink-0 text-pac-linea-fuerte transition-colors group-hover:text-pac-rojo"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Contenedor>
      </main>

      <Pie />
    </div>
  );
}

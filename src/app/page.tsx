import Link from "next/link";
import { ArrowRight, MapPin, Scale, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { BarraSuperior } from "@/components/shell/barra_superior";
import { Pie } from "@/components/shell/pie";
import { Contenedor } from "@/components/ui/pagina";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Cifra } from "@/components/ui/panel";

type Cobertura = {
  productos: number | null;
  comercios: number | null;
  precios: number | null;
  ultima: string | null;
};

async function cobertura(): Promise<Cobertura> {
  const vacia: Cobertura = {
    productos: null,
    comercios: null,
    precios: null,
    ultima: null,
  };

  try {
    const supabase = await createClient();

    const [productos, comercios, precios, ultima] = await Promise.all([
      supabase
        .from("productos")
        .select("*", { count: "exact", head: true })
        .eq("activo", true),
      supabase
        .from("comercios")
        .select("*", { count: "exact", head: true })
        .eq("activo", true),
      supabase.from("precios").select("*", { count: "exact", head: true }),
      supabase
        .from("precios")
        .select("fecha_registro")
        .order("fecha_registro", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      productos: productos.count ?? null,
      comercios: comercios.count ?? null,
      precios: precios.count ?? null,
      ultima: ultima.data?.fecha_registro ?? null,
    };
  } catch {
    return vacia;
  }
}

function fechaLarga(iso: string | null) {
  if (!iso) return "sin registros";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const ACCESOS = [
  {
    href: "/mapa",
    titulo: "Mapa de comercios",
    descripcion:
      "Ubica almacenes, ferias y negocios de la comuna y revisa los precios vigentes de cada uno.",
    icono: MapPin,
  },
  {
    href: "/comparador",
    titulo: "Comparador de precios",
    descripcion:
      "Elige un producto y ordena los comercios de menor a mayor precio antes de salir a comprar.",
    icono: Scale,
  },
  {
    href: "/login",
    titulo: "Carga de precios",
    descripcion:
      "Acceso para comercios y equipos de terreno: registro manual o carga semanal por planilla.",
    icono: Upload,
  },
];

export default async function Portada() {
  const datos = await cobertura();

  return (
    <>
      <BarraSuperior fija />

      <main className="flex-1">
        <section className="border-b border-pac-linea">
          <Contenedor className="grid gap-10 py-12 lg:grid-cols-12 lg:gap-14 lg:py-20">
            <div className="lg:col-span-7">
              <Etiqueta className="mb-4 block">
                Municipalidad de Pedro Aguirre Cerda
              </Etiqueta>

              <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-[1.03] text-pac-azul">
                Observatorio
                <br />
                Comunal de Precios
              </h1>

              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-pac-tinta-suave">
                Cuánto cuesta el pan, el aceite o la leche en cada esquina de la
                comuna. Precios relevados en terreno por el municipio y
                publicados sin intermediarios, para que comprar sea una decisión
                informada.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/comparador"
                  className="inline-flex h-12 items-center gap-2 border border-pac-rojo bg-pac-rojo px-6 text-[12px] font-bold uppercase tracking-[0.09em] text-white transition-colors duration-150 hover:border-pac-rojo-oscuro hover:bg-pac-rojo-oscuro"
                >
                  Comparar precios
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/mapa"
                  className="inline-flex h-12 items-center gap-2 border border-pac-azul/35 px-6 text-[12px] font-bold uppercase tracking-[0.09em] text-pac-azul transition-colors duration-150 hover:border-pac-azul hover:bg-pac-azul-tenue"
                >
                  Ver el mapa
                </Link>
              </div>

              <p className="mt-6 text-[12px] leading-relaxed text-pac-tinta-suave">
                Los precios son referenciales y corresponden al último
                relevamiento de cada comercio. No constituyen una oferta
                comercial.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-pac-azul p-7">
                <p className="micro mb-6 text-white/55">Cobertura actual</p>

                <div className="grid grid-cols-2 gap-x-6 gap-y-7">
                  <Cifra
                    valor={datos.productos ?? "—"}
                    rotulo="Productos"
                    invertida
                  />
                  <Cifra
                    valor={datos.comercios ?? "—"}
                    rotulo="Comercios"
                    invertida
                  />
                  <Cifra
                    valor={datos.precios ?? "—"}
                    rotulo="Precios registrados"
                    invertida
                  />
                  <Cifra
                    valor={new Date().getFullYear().toString()}
                    rotulo="Período en curso"
                    invertida
                  />
                </div>

                <div className="mt-7 border-t border-white/20 pt-5">
                  <p className="micro mb-2 text-white/45">Última actualización</p>
                  <p className="font-slab text-[15px] font-medium text-white">
                    {fechaLarga(datos.ultima)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[12px] leading-relaxed text-pac-tinta-suave">
                Cifras calculadas sobre la base del Observatorio al{" "}
                {new Date().toLocaleDateString("es-CL")}.
              </p>
            </div>
          </Contenedor>
        </section>

        <section className="bg-pac-fondo/60">
          <Contenedor className="py-12 lg:py-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <Etiqueta className="mb-2 block">Accesos</Etiqueta>
                <h2 className="text-[22px] font-bold text-pac-azul">
                  Tres formas de usar el observatorio
                </h2>
              </div>
            </div>

            <div className="grid gap-px bg-pac-linea sm:grid-cols-3">
              {ACCESOS.map((a) => {
                const Icono = a.icono;
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="group relative flex flex-col bg-pac-azul p-6 text-white transition-colors duration-150 hover:bg-pac-azul-profundo"
                  >
                    <span className="absolute inset-x-0 top-0 h-[3px] bg-pac-rojo opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                    <Icono
                      className="mb-8 size-7 text-white/80"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <h3 className="text-[16px] font-bold leading-snug">
                      {a.titulo}
                    </h3>
                    <p className="mt-2 flex-1 text-[13px] leading-relaxed text-white/70">
                      {a.descripcion}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/85">
                      Entrar
                      <ArrowRight
                        className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </Contenedor>
        </section>

        <section>
          <Contenedor className="grid gap-8 py-12 sm:grid-cols-3 lg:py-16">
            {[
              {
                titulo: "Relevamiento en terreno",
                texto:
                  "Funcionarios y equipos de terreno registran los precios directamente en cada local, con fecha y comercio asociado.",
              },
              {
                titulo: "Catálogo normalizado",
                texto:
                  "Cada producto tiene nombre, marca y formato canónicos. Los sinónimos del habla local se resuelven contra ese catálogo.",
              },
              {
                titulo: "Trazabilidad verificable",
                texto:
                  "Cada cambio queda en un registro encadenado por hash, de modo que un precio publicado puede auditarse hacia atrás.",
              },
            ].map((n) => (
              <div key={n.titulo} className="border-t-[3px] border-t-pac-azul pt-4">
                <h3 className="text-[15px] font-bold text-pac-azul">{n.titulo}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-pac-tinta-suave">
                  {n.texto}
                </p>
              </div>
            ))}
          </Contenedor>
        </section>
      </main>

      <Pie />
    </>
  );
}

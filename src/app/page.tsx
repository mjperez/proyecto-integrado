import Link from "next/link";
import { ArrowRight, MapPin, Scale, ShieldCheck, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { BarraSuperior } from "@/components/shell/barra_superior";
import { Pie } from "@/components/shell/pie";
import { Contenedor } from "@/components/ui/pagina";

type Precio = {
  id_producto: number;
  valor: number;
  fecha_registro: string;
  productos: { nombre: string; formato: string } | null;
  comercios: { nombre: string } | null;
};

type Tablero = {
  productos: number;
  comercios: number;
  precios: number;
  ultima: string | null;
  vigentes: Precio[];
};

const VACIO: Tablero = {
  productos: 0,
  comercios: 0,
  precios: 0,
  ultima: null,
  vigentes: [],
};

async function tablero(): Promise<Tablero> {
  try {
    const supabase = await createClient();

    const [productos, comercios, precios, vigentes] = await Promise.all([
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
        .from("v_precio_actual")
        .select(
          "id_producto, valor, fecha_registro, productos(nombre, formato), comercios(nombre)",
        )
        .limit(120),
    ]);

    const filas = ((vigentes.data ?? []) as unknown as Precio[]).filter(
      (p) => p.productos && p.comercios,
    );

    const ultima = filas.reduce<string | null>(
      (max, p) => (!max || p.fecha_registro > max ? p.fecha_registro : max),
      null,
    );

    return {
      productos: productos.count ?? 0,
      comercios: comercios.count ?? 0,
      precios: precios.count ?? 0,
      ultima,
      vigentes: filas,
    };
  } catch {
    return VACIO;
  }
}

function pesos(valor: number) {
  return `$${valor.toLocaleString("es-CL")}`;
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
  });
}

function fechaLarga(iso: string | null) {
  if (!iso) return "sin relevamientos";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Agrupa por producto; cada grupo queda ordenado de menor a mayor precio. */
function agrupar(filas: Precio[]) {
  const mapa = new Map<number, Precio[]>();
  for (const f of filas) {
    const grupo = mapa.get(f.id_producto);
    if (grupo) grupo.push(f);
    else mapa.set(f.id_producto, [f]);
  }
  return [...mapa.values()]
    .map((g) => g.slice().sort((a, b) => a.valor - b.valor))
    .sort((a, b) =>
      (a[0].productos?.nombre ?? "").localeCompare(
        b[0].productos?.nombre ?? "",
        "es",
      ),
    );
}

const DESTACADOS = [
  { href: "/mapa", etiqueta: "Mapa de comercios", icono: MapPin },
  { href: "/comparador", etiqueta: "Comparador de precios", icono: Scale },
  { href: "/ingesta", etiqueta: "Carga de precios", icono: Upload },
  { href: "/admin/auditoria", etiqueta: "Auditoría de cambios", icono: ShieldCheck },
];

export default async function Portada() {
  const d = await tablero();
  const grupos = agrupar(d.vigentes);

  // Cuatro productos con mayor cobertura: los que mejor muestran la
  // diferencia de precio entre comercios.
  const tiles = [...grupos]
    .sort((a, b) => b.length - a.length)
    .slice(0, 4)
    .sort((a, b) =>
      (a[0].productos?.nombre ?? "").localeCompare(
        b[0].productos?.nombre ?? "",
        "es",
      ),
    );

  // Se muestran productos completos, no filas cortadas a la mitad.
  const filas: Precio[] = [];
  for (const g of grupos) {
    if (filas.length > 0 && filas.length + g.length > 18) break;
    filas.push(...g);
  }

  const minimos = new Map<number, number>();
  for (const g of grupos) minimos.set(g[0].id_producto, g[0].valor);

  return (
    <>
      <BarraSuperior
        fija
        nota={`Último relevamiento: ${fechaLarga(d.ultima)} · ${d.precios.toLocaleString(
          "es-CL",
        )} precios en ${d.comercios} comercios`}
      />

      <main className="flex-1">
        {/* Hero a sangre con el bloque de destacados al costado, igual que la
            portada del municipio: contenido a la izquierda, accesos en rojo. */}
        <section className="bg-pac-azul-profundo">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid lg:grid-cols-[1fr_320px]">
              <div className="px-5 py-14 sm:px-8 lg:py-20">
                <p className="micro mb-4 text-pac-rojo">Observatorio Comunal</p>
                <h1 className="max-w-xl text-[clamp(1.9rem,3.8vw,3rem)] leading-[1.05] text-white">
                  Cuánto cuesta comprar en Pedro Aguirre Cerda
                </h1>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
                  Precios de alimentos y productos básicos relevados en terreno
                  por el municipio, comercio por comercio y con la fecha de cada
                  registro.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/comparador"
                    className="inline-flex h-11 items-center gap-2 bg-pac-rojo px-6 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-pac-rojo-oscuro"
                  >
                    Comparar precios
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/mapa"
                    className="inline-flex h-11 items-center gap-2 border border-white/35 px-6 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
                  >
                    Ver el mapa
                  </Link>
                </div>
              </div>

              <aside className="bg-pac-azul px-5 py-6 sm:px-6">
                <h2 className="text-[17px] font-bold text-white">Destacados</h2>

                <ul className="mt-4 flex flex-col gap-2">
                  {DESTACADOS.map((dest) => {
                    const Icono = dest.icono;
                    return (
                      <li key={dest.href}>
                        <Link
                          href={dest.href}
                          className="flex h-11 items-center gap-2.5 bg-pac-rojo px-3 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-pac-rojo-oscuro"
                        >
                          <Icono
                            className="size-4 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <span className="truncate">{dest.etiqueta}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* Tiles sólidos, el mismo bloque que usa el municipio para sus
            servicios. Aquí llevan los productos con más comercios. */}
        {tiles.length > 0 && (
          <section className="border-b border-pac-linea bg-white">
            <Contenedor ancho="amplio">
              <div className="grid grid-cols-2 gap-3 py-8 sm:gap-4 lg:grid-cols-4">
                {tiles.map((g) => (
                  <Link
                    key={g[0].id_producto}
                    href="/comparador"
                    className="group flex flex-col bg-pac-rojo px-4 py-5 text-white transition-colors duration-150 hover:bg-pac-rojo-oscuro"
                  >
                    <p className="text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-white/65">
                      Desde
                    </p>
                    <p className="cifra mt-2 text-[24px] font-bold leading-none">
                      {pesos(g[0].valor)}
                    </p>
                    <p className="mt-3 line-clamp-2 text-[12px] font-bold uppercase leading-snug tracking-[0.04em]">
                      {g[0].productos?.nombre}
                    </p>
                    <p className="mt-auto truncate pt-2 text-[11px] text-white/65">
                      {g[0].comercios?.nombre} · {g.length} locales
                    </p>
                  </Link>
                ))}
              </div>
            </Contenedor>
          </section>
        )}

        {/* Tabla de precios: el cuerpo de la página. */}
        <section>
          <Contenedor ancho="amplio">
            <div className="pt-10 pb-3">
              <h2 className="text-center text-[26px] leading-tight text-pac-azul">
                Precios vigentes
              </h2>
              <p className="mt-1.5 text-center text-[12.5px] text-pac-tinta-suave">
                Último precio registrado de cada producto en cada comercio.
              </p>
            </div>

            {filas.length === 0 ? (
              <div className="border-y border-pac-linea py-10">
                <p className="text-[14px] text-pac-tinta-suave">
                  Todavía no hay precios publicados. El municipio carga los
                  datos semanalmente.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-y border-pac-linea">
                    <th
                      scope="col"
                      className="micro py-2 pl-2 pr-3 text-pac-tinta-suave"
                    >
                      Producto
                    </th>
                    <th
                      scope="col"
                      className="micro hidden py-2 pr-3 text-pac-tinta-suave md:table-cell"
                    >
                      Comercio
                    </th>
                    <th
                      scope="col"
                      className="micro hidden py-2 pr-3 text-pac-tinta-suave lg:table-cell"
                    >
                      Actualizado
                    </th>
                    <th
                      scope="col"
                      className="micro py-2 pr-3 text-right text-pac-tinta-suave"
                    >
                      Precio
                    </th>
                    <th
                      scope="col"
                      className="micro hidden py-2 text-right text-pac-tinta-suave sm:table-cell"
                    >
                      Sobre el mínimo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((p, i) => {
                    const min = minimos.get(p.id_producto) ?? p.valor;
                    const delta =
                      min > 0 ? Math.round(((p.valor - min) / min) * 100) : 0;
                    return (
                      <tr
                        key={`${p.id_producto}-${p.comercios?.nombre}-${i}`}
                        className="border-b border-pac-linea transition-colors hover:bg-pac-fondo/70"
                      >
                        <td
                          className={`border-l-2 py-2.5 pl-2 pr-3 ${
                            delta === 0
                              ? "border-l-pac-rojo"
                              : "border-l-transparent"
                          }`}
                        >
                          <p className="text-[13.5px] font-medium leading-snug text-pac-tinta">
                            {p.productos?.nombre}
                          </p>
                          <p className="text-[11px] text-pac-tinta-suave">
                            {p.productos?.formato}
                            <span className="md:hidden">
                              {" "}
                              · {p.comercios?.nombre}
                            </span>
                          </p>
                        </td>
                        <td className="hidden py-2.5 pr-3 text-[13px] text-pac-tinta-suave md:table-cell">
                          {p.comercios?.nombre}
                        </td>
                        <td className="cifra hidden py-2.5 pr-3 text-[12px] text-pac-tinta-suave lg:table-cell">
                          {fechaCorta(p.fecha_registro)}
                        </td>
                        <td className="cifra py-2.5 pr-3 text-right text-[14px] font-bold text-pac-tinta">
                          {pesos(p.valor)}
                        </td>
                        <td className="hidden py-2.5 text-right sm:table-cell">
                          {delta === 0 ? (
                            <span className="micro text-pac-rojo">mínimo</span>
                          ) : (
                            <span className="cifra text-[12px] text-pac-tinta-suave">
                              +{delta}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 py-5">
              <p className="max-w-2xl text-[11px] leading-relaxed text-pac-tinta-suave">
                Precios referenciales del último relevamiento de cada comercio.
                No constituyen una oferta comercial.
              </p>
              <Link
                href="/comparador"
                className="text-[12px] font-bold uppercase tracking-[0.06em] text-pac-azul transition-colors hover:text-pac-rojo"
              >
                Ver el catálogo completo
              </Link>
            </div>
          </Contenedor>
        </section>
      </main>

      <Pie />
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { BarraSuperior } from "@/components/shell/barra_superior";
import { Pie } from "@/components/shell/pie";
import { Aviso } from "@/components/ui/aviso";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Etiqueta, Insignia } from "@/components/ui/etiqueta";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

// Cliente de navegador con la sesión en cookies, para que el proxy y los
// Server Components puedan verla.
const supabase = createClient();

type Producto = {
  id_producto: number;
  nombre: string;
  marca: string;
  formato: string;
};

type Fila = {
  valor: number;
  fecha_registro: string;
  comercios: { nombre: string; direccion: string };
};

function pesos(valor: number) {
  return `$${valor.toLocaleString("es-CL")}`;
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
  });
}

export default function Comparador() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState<Producto | null>(null);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("productos")
      .select("id_producto, nombre, marca, formato")
      .eq("activo", true)
      .order("nombre")
      .then(({ data, error }) => {
        if (error) {
          setError("No se pudo cargar el catálogo de productos.");
          return;
        }
        setProductos(data ?? []);
      });
  }, []);

  async function comparar(p: Producto) {
    setSeleccion(p);
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/comparador?producto=${p.id_producto}`);
      const json = (await res.json()) as { precios: Fila[] };
      setFilas(json.precios ?? []);
    } catch {
      setFilas([]);
      setError("No se pudieron obtener los precios. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) =>
      `${p.nombre} ${p.marca} ${p.formato}`.toLowerCase().includes(q),
    );
  }, [productos, busqueda]);

  const minimo = filas.length ? Math.min(...filas.map((f) => f.valor)) : null;
  const maximo = filas.length ? Math.max(...filas.map((f) => f.valor)) : null;
  const diferencia =
    minimo && maximo && minimo > 0
      ? Math.round(((maximo - minimo) / minimo) * 100)
      : null;

  return (
    <>
      <BarraSuperior fija />

      <main className="flex-1">
        <Contenedor ancho="amplio">
          <EncabezadoPagina
            miga={[{ etiqueta: "Inicio", href: "/" }, { etiqueta: "Comparador" }]}
            titulo="Comparador de precios"
            descripcion="Elige un producto del catálogo y revisa cuánto cuesta en cada comercio de la comuna."
          />

          <div className="grid gap-6 py-8 lg:grid-cols-[320px_1fr] lg:items-start">
            {/* Catálogo */}
            <Panel className="lg:sticky lg:top-24">
              <div className="border-b border-pac-linea p-3">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-pac-tinta-suave"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar producto"
                    aria-label="Buscar producto"
                    className="h-10 w-full rounded-md border border-pac-linea-fuerte bg-white pl-9 pr-3 text-[14px] placeholder:text-pac-tinta-suave/70 focus:border-pac-azul focus:outline-none focus:ring-2 focus:ring-pac-azul/15"
                  />
                </div>
                <p className="mt-2 text-[11px] text-pac-tinta-suave">
                  {filtrados.length} de {productos.length} productos
                </p>
              </div>

              <ul className="max-h-[420px] overflow-y-auto lg:max-h-[560px]">
                {filtrados.map((p) => {
                  const activo = seleccion?.id_producto === p.id_producto;
                  return (
                    <li key={p.id_producto}>
                      <button
                        type="button"
                        onClick={() => comparar(p)}
                        aria-pressed={activo}
                        className={cn(
                          "flex w-full items-baseline justify-between gap-3 border-l-[3px] px-3.5 py-2.5 text-left transition-colors duration-150",
                          activo
                            ? "border-l-pac-rojo bg-pac-azul-tenue"
                            : "border-l-transparent hover:bg-pac-fondo",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[13.5px] font-medium leading-snug",
                            activo ? "text-pac-azul" : "text-pac-tinta",
                          )}
                        >
                          {p.nombre}
                        </span>
                        <span className="shrink-0 text-[11px] text-pac-tinta-suave">
                          {p.formato}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {filtrados.length === 0 && (
                  <li className="px-4 py-6 text-[13px] text-pac-tinta-suave">
                    Ningún producto coincide con “{busqueda}”.
                  </li>
                )}
              </ul>
            </Panel>

            {/* Resultados */}
            <div className="min-w-0">
              {error && <Aviso tono="error">{error}</Aviso>}

              {!seleccion && !error && (
                <EstadoVacio
                  titulo="Elige un producto para comparar"
                  descripcion="El listado de la izquierda reúne el catálogo completo. Al seleccionar uno verás todos los comercios con precio registrado, ordenados de menor a mayor."
                />
              )}

              {cargando && (
                <div className="flex flex-col gap-px bg-pac-linea" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[72px] bg-white" />
                  ))}
                </div>
              )}

              {!cargando && seleccion && filas.length > 0 && (
                <>
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <Etiqueta className="mb-1.5 block">Producto</Etiqueta>
                      <h2 className="text-[20px] font-bold leading-tight text-pac-azul">
                        {seleccion.nombre}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-pac-tinta-suave">
                        {seleccion.marca} · {seleccion.formato}
                      </p>
                    </div>

                    <dl className="flex items-end gap-6">
                      <div>
                        <dt className="micro mb-1 text-pac-tinta-suave">Comercios</dt>
                        <dd className="cifra font-slab text-[20px] font-bold leading-none text-pac-tinta">
                          {filas.length}
                        </dd>
                      </div>
                      <div>
                        <dt className="micro mb-1 text-pac-tinta-suave">Desde</dt>
                        <dd className="cifra font-slab text-[20px] font-bold leading-none text-pac-azul">
                          {pesos(minimo ?? 0)}
                        </dd>
                      </div>
                      {diferencia !== null && (
                        <div>
                          <dt className="micro mb-1 text-pac-tinta-suave">Brecha</dt>
                          <dd className="cifra font-slab text-[20px] font-bold leading-none text-pac-tinta">
                            {diferencia}%
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <ol className="border border-pac-linea bg-white">
                    {filas.map((f, i) => {
                      const esMinimo = f.valor === minimo;
                      return (
                        <li
                          key={`${f.comercios.nombre}-${f.fecha_registro}`}
                          className={cn(
                            "flex items-center gap-4 border-b border-pac-linea px-4 py-3.5 last:border-b-0",
                            esMinimo && "border-l-[3px] border-l-pac-rojo pl-[13px]",
                          )}
                        >
                          <span className="cifra w-6 shrink-0 text-[12px] font-medium text-pac-tinta-suave">
                            {String(i + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[14px] font-bold leading-snug text-pac-tinta">
                                {f.comercios.nombre}
                              </p>
                              {esMinimo && (
                                <Insignia tono="destacado">Menor precio</Insignia>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[12px] text-pac-tinta-suave">
                              {f.comercios.direccion}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p
                              className={cn(
                                "cifra font-slab text-[19px] font-bold leading-none",
                                esMinimo ? "text-pac-azul" : "text-pac-tinta",
                              )}
                            >
                              {pesos(f.valor)}
                            </p>
                            <p className="mt-1 text-[11px] text-pac-tinta-suave">
                              {fechaCorta(f.fecha_registro)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <p className="mt-3 text-[11px] leading-relaxed text-pac-tinta-suave">
                    Precios referenciales registrados por el municipio en la
                    fecha indicada. La brecha compara el precio más alto contra
                    el más bajo de la lista.
                  </p>
                </>
              )}

              {!cargando && seleccion && filas.length === 0 && (
                <EstadoVacio
                  titulo="Todavía no hay precios de este producto"
                  descripcion={`Ningún comercio tiene registrado ${seleccion.nombre.toLowerCase()} por ahora. Prueba con otro producto del catálogo.`}
                />
              )}
            </div>
          </div>
        </Contenedor>
      </main>

      <Pie />
    </>
  );
}

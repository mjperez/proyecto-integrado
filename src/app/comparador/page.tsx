"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, Search, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { BarraSuperior } from "@/components/shell/barra_superior";
import { Pie } from "@/components/shell/pie";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Etiqueta, Insignia } from "@/components/ui/etiqueta";
import { Panel } from "@/components/ui/panel";
import { HistorialPrecios } from "@/components/historial_precios";
import {
  formatearDistancia,
  type FilaComparador,
  type Orden,
  type ResumenComparador,
} from "@/lib/comparador";
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

type Referencia = { lat: number | null; lng: number | null; origen: string };

type Coordenadas = { lat: number; lng: number };

type Respuesta = {
  clave: string;
  precios: FilaComparador[];
  resumen: ResumenComparador | null;
  referencia: Referencia | null;
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

/**
 * Identifica la consulta en curso. La respuesta se guarda junto con su clave,
 * así el estado de carga se deriva y nunca se muestra el resultado de una
 * consulta anterior mientras llega la siguiente.
 */
function claveConsulta(
  producto: Producto,
  orden: Orden,
  coords: Coordenadas | null,
) {
  const punto = coords ? `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}` : "comuna";
  return `${producto.id_producto}|${orden}|${punto}`;
}

export default function Comparador() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState<Producto | null>(null);
  const [orden, setOrden] = useState<Orden>("precio");
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [pidiendoUbicacion, setPidiendoUbicacion] = useState(false);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
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

  // El comparador se vuelve a pedir cada vez que cambia el producto, el orden o
  // el punto de referencia: la distancia la calcula el servidor.
  useEffect(() => {
    if (!seleccion) return;

    const consulta = new URLSearchParams({
      producto: String(seleccion.id_producto),
      orden,
    });
    if (coordenadas) {
      consulta.set("lat", String(coordenadas.lat));
      consulta.set("lng", String(coordenadas.lng));
    }

    let cancelado = false;
    const clave = claveConsulta(seleccion, orden, coordenadas);

    fetch(`/api/comparador?${consulta}`)
      .then((res) => {
        if (!res.ok) throw new Error("respuesta no válida");
        return res.json() as Promise<Omit<Respuesta, "clave">>;
      })
      .then((json) => {
        if (cancelado) return;
        setRespuesta({
          clave,
          precios: json.precios ?? [],
          resumen: json.resumen,
          referencia: json.referencia,
        });
      })
      .catch(() => {
        if (cancelado) return;
        setRespuesta({ clave, precios: [], resumen: null, referencia: null });
        setError("No se pudieron obtener los precios. Intenta nuevamente.");
      });

    return () => {
      cancelado = true;
    };
  }, [seleccion, orden, coordenadas]);

  const usarMiUbicacion = useCallback(() => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError(
        "Tu navegador no permite geolocalización. Puedes seguir comparando por precio.",
      );
      return;
    }
    setPidiendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setCoordenadas({
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude,
        });
        setOrden("distancia");
        setPidiendoUbicacion(false);
      },
      () => {
        setPidiendoUbicacion(false);
        setError("No se pudo obtener tu ubicación. Puedes seguir comparando por precio.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) =>
      `${p.nombre} ${p.marca} ${p.formato}`.toLowerCase().includes(q),
    );
  }, [productos, busqueda]);

  const clave = seleccion ? claveConsulta(seleccion, orden, coordenadas) : null;
  const cargando = seleccion !== null && respuesta?.clave !== clave;
  const filas = respuesta?.clave === clave ? respuesta.precios : [];
  const resumen = respuesta?.clave === clave ? respuesta.resumen : null;
  const referencia = respuesta?.clave === clave ? respuesta.referencia : null;
  const minimo = resumen?.minimo ?? null;

  return (
    <>
      <BarraSuperior fija />

      <main id="contenido" className="flex-1">
        <Contenedor ancho="amplio">
          <EncabezadoPagina
            miga={[{ etiqueta: "Inicio", href: "/" }, { etiqueta: "Comparador" }]}
            titulo="Comparador de precios"
            descripcion="Elige un producto del catálogo y revisa cuánto cuesta en cada comercio de la comuna. No necesitas cuenta."
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
                        onClick={() => setSeleccion(p)}
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
              {error && (
                <Aviso tono="error" className="mb-4">
                  {error}
                </Aviso>
              )}

              {!seleccion && !error && (
                <EstadoVacio
                  titulo="Elige un producto para comparar"
                  descripcion="El listado de la izquierda reúne el catálogo completo. Al seleccionar uno verás todos los comercios con precio vigente, ordenados de menor a mayor."
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
                          {resumen?.comercios ?? filas.length}
                        </dd>
                      </div>
                      <div>
                        <dt className="micro mb-1 text-pac-tinta-suave">Desde</dt>
                        <dd className="cifra font-slab text-[20px] font-bold leading-none text-pac-azul">
                          {pesos(minimo ?? 0)}
                        </dd>
                      </div>
                      {resumen?.brecha_pct != null && (
                        <div>
                          <dt className="micro mb-1 text-pac-tinta-suave">Brecha</dt>
                          <dd className="cifra font-slab text-[20px] font-bold leading-none text-pac-tinta">
                            {resumen.brecha_pct}%
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Orden y punto de referencia */}
                  <div className="mb-3 flex flex-wrap items-center gap-2 border border-pac-linea bg-white px-3 py-2.5">
                    <span className="micro mr-1 text-pac-tinta-suave">Ordenar por</span>
                    <div className="inline-flex border border-pac-linea-fuerte">
                      <button
                        type="button"
                        onClick={() => setOrden("precio")}
                        aria-pressed={orden === "precio"}
                        className={cn(
                          "px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors",
                          orden === "precio"
                            ? "bg-pac-azul text-white"
                            : "bg-white text-pac-azul hover:bg-pac-azul-tenue",
                        )}
                      >
                        Menor precio
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrden("distancia")}
                        aria-pressed={orden === "distancia"}
                        className={cn(
                          "border-l border-pac-linea-fuerte px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors",
                          orden === "distancia"
                            ? "bg-pac-azul text-white"
                            : "bg-white text-pac-azul hover:bg-pac-azul-tenue",
                        )}
                      >
                        Más cerca
                      </button>
                    </div>

                    <div className="ml-auto">
                      {coordenadas ? (
                        <Boton
                          variante="fantasma"
                          tamano="sm"
                          onClick={() => setCoordenadas(null)}
                          title="Quitar mi ubicación"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                          Quitar ubicación
                        </Boton>
                      ) : (
                        <Boton
                          variante="contorno"
                          tamano="sm"
                          onClick={usarMiUbicacion}
                          disabled={pidiendoUbicacion}
                        >
                          <Crosshair className="size-3.5" aria-hidden="true" />
                          {pidiendoUbicacion ? "Buscando…" : "Usar mi ubicación"}
                        </Boton>
                      )}
                    </div>
                  </div>

                  <p className="mb-3 text-[11px] text-pac-tinta-suave">
                    {referencia?.origen === "usuario"
                      ? "Distancias medidas desde tu ubicación."
                      : "Distancias medidas desde el centro de los comercios registrados. Activa tu ubicación para medirlas desde donde estás."}
                  </p>

                  <div className="hidden items-center gap-4 border border-b-0 border-pac-linea bg-pac-fondo px-4 py-2 sm:flex">
                    <span className="w-6 shrink-0" />
                    <span className="micro flex-1 text-pac-tinta-suave">Comercio</span>
                    <span className="micro w-20 shrink-0 text-right text-pac-tinta-suave">
                      Distancia
                    </span>
                    <span className="micro w-[86px] shrink-0 text-right text-pac-tinta-suave">
                      Precio
                    </span>
                  </div>

                  <ol className="border border-pac-linea bg-white">
                    {filas.map((f, i) => {
                      const esMinimo = f.valor === minimo;
                      return (
                        <li
                          key={f.id_comercio}
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
                                {f.comercio}
                              </p>
                              {esMinimo && <Insignia tono="destacado">Menor precio</Insignia>}
                            </div>
                            <p className="mt-0.5 truncate text-[12px] text-pac-tinta-suave">
                              {f.direccion}
                            </p>
                          </div>

                          <p className="cifra hidden w-20 shrink-0 text-right text-[13px] font-medium leading-none text-pac-tinta sm:block">
                            {formatearDistancia(f.distancia_m)}
                          </p>

                          <div className="w-[86px] shrink-0 text-right">
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
                    Precios referenciales registrados por el municipio en la fecha
                    indicada. La brecha compara el precio más alto contra el más bajo
                    de la lista.
                  </p>

                  <HistorialPrecios idProducto={seleccion.id_producto} />
                </>
              )}

              {!cargando && seleccion && filas.length === 0 && !error && (
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

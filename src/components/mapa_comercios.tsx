"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, Store } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth_provider";
import { etiquetaTipo } from "@/lib/tipos_comercio";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada, Selector } from "@/components/ui/campo";
import { Etiqueta, Insignia } from "@/components/ui/etiqueta";

// Cliente de navegador con la sesión en cookies, para que el proxy y los
// Server Components puedan verla.
const supabase = createClient();

type ComercioMapa = {
  id_comercio: number;
  nombre: string;
  direccion: string;
  tipo: string;
  lat: number;
  lng: number;
};

type Producto = { id_producto: number; nombre: string; formato: string };

type PrecioVigente = {
  valor: number;
  fecha_registro: string;
  productos: { nombre: string; formato: string };
};

type ComercioPropio = { id_comercio: number; nombre: string };

const ROLES_INGESTA = ["comercio", "terreno", "administrador"];

function pesos(valor: number) {
  return `$${valor.toLocaleString("es-CL")}`;
}

export default function MapaComercios() {
  const { perfil } = useAuth();
  const rol = perfil?.roles?.nombre;
  const esComercio = rol === "comercio";
  const esIngesta = perfil ? ROLES_INGESTA.includes(rol ?? "") : false;

  const divRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadoresRef = useRef<Map<number, L.CircleMarker>>(new Map());

  const [comercios, setComercios] = useState<ComercioMapa[]>([]);
  const [seleccionado, setSeleccionado] = useState<ComercioMapa | null>(null);
  const [precios, setPrecios] = useState<PrecioVigente[]>([]);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [formProducto, setFormProducto] = useState<number | null>(null);
  const [formValor, setFormValor] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Comercios propios del usuario (rol comercio); puede tener varios.
  const [misComercios, setMisComercios] = useState<ComercioPropio[]>([]);
  const [comercioElegido, setComercioElegido] = useState<number | null>(null);

  // 1. Cargar comercios desde la vista (reemplaza a dbSimulada)
  useEffect(() => {
    supabase
      .from("v_comercios_mapa")
      .select("*")
      .then(({ data }) => setComercios((data as ComercioMapa[]) ?? []));
  }, []);

  // 2. Inicializar el mapa una sola vez y limpiarlo al desmontar
  useEffect(() => {
    if (!divRef.current || mapaRef.current) return;

    const mapa = L.map(divRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([-33.503, -70.7155], 14);

    // Los controles van abajo a la derecha para no chocar con el contador.
    L.control.zoom({ position: "bottomright" }).addTo(mapa);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);

    mapaRef.current = mapa;
    const marcadores = marcadoresRef.current;
    return () => {
      mapa.remove();
      mapaRef.current = null;
      marcadores.clear();
    };
  }, []);

  // El mapa se inicializa con un tamaño fijo; si el contenedor cambia
  // (ej: al abrir la tarjeta de precios), hay que avisarle a Leaflet
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !divRef.current) return;
    const obs = new ResizeObserver(() => mapa.invalidateSize());
    obs.observe(divRef.current);
    return () => obs.disconnect();
  }, []);

  // 3. Dibujar un círculo por comercio y encuadrar el mapa
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || comercios.length === 0) return;

    comercios.forEach((c) => {
      const marcador = L.circleMarker([c.lat, c.lng], {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: "#004283",
        fillOpacity: 1,
      })
        .addTo(mapa)
        .bindTooltip(c.nombre, { direction: "top", offset: [0, -8] })
        .on("click", () => setSeleccionado(c));

      marcadoresRef.current.set(c.id_comercio, marcador);
    });

    mapa.fitBounds(
      L.latLngBounds(comercios.map((c) => [c.lat, c.lng] as [number, number])),
      { padding: [40, 40] },
    );
  }, [comercios]);

  // 3b. El comercio activo se pinta en rojo, igual que el acento de la interfaz.
  useEffect(() => {
    marcadoresRef.current.forEach((marcador, id) => {
      const activo = id === seleccionado?.id_comercio;
      marcador.setStyle({
        fillColor: activo ? "#c32e26" : "#004283",
        radius: activo ? 10 : 8,
      });
      if (activo) marcador.bringToFront();
    });
  }, [seleccionado]);

  // Comercio destino: el del usuario (comercio) o el clickeado (terreno/admin).
  const idComercioDestino: number | null = esComercio
    ? comercioElegido
    : (seleccionado?.id_comercio ?? null);

  // 4. Precios vigentes del comercio destino (el que se muestra y donde se guarda)
  useEffect(() => {
    if (!idComercioDestino) return;

    let cancelado = false;
    supabase
      .from("v_precio_actual")
      .select("valor, fecha_registro, productos(nombre, formato)")
      .eq("id_comercio", idComercioDestino)
      .then(({ data }) => {
        if (cancelado) return;
        setPrecios((data as unknown as PrecioVigente[]) ?? []);
      });

    return () => {
      cancelado = true;
    };
  }, [idComercioDestino]);

  // 5. Para la ingesta: catálogo de productos (cualquier rol de ingesta)
  useEffect(() => {
    if (!esIngesta) return;
    supabase
      .from("productos")
      .select("id_producto, nombre, formato")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => setProductos((data as Producto[]) ?? []));
  }, [esIngesta]);

  // 5b. Rol "comercio": cargar TODOS sus comercios vinculados (puede tener varios)
  useEffect(() => {
    if (!esComercio) return;
    supabase
      .from("usuarios_comercios")
      .select("id_comercio, comercios(nombre)")
      .then(({ data }) => {
        const lista = (
          (data ?? []) as Array<{
            id_comercio: number;
            comercios: { nombre: string } | null;
          }>
        ).map((r) => ({
          id_comercio: r.id_comercio,
          nombre: r.comercios?.nombre ?? "",
        }));
        setMisComercios(lista);
        setComercioElegido(lista[0]?.id_comercio ?? null);
      });
  }, [esComercio]);

  async function guardarPrecio() {
    if (!idComercioDestino || !formProducto || formValor === "") {
      setMensaje("Selecciona un producto e ingresa un precio.");
      return;
    }
    const valor = Number(formValor);
    if (!Number.isFinite(valor) || valor <= 0) {
      setMensaje("El precio debe ser un número mayor que 0.");
      return;
    }

    setGuardando(true);
    // US-C1: el comercio se asocia al del usuario autenticado (rol comercio),
    // no al pin clickeado en el mapa.
    const { error } = await supabase.from("precios").insert({
      id_producto: formProducto,
      id_comercio: idComercioDestino,
      valor,
      fecha_registro: new Date().toISOString(),
    });
    setGuardando(false);

    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    setMensaje("Precio registrado.");
    setFormValor("");
    setFormProducto(null);
    const { data } = await supabase
      .from("v_precio_actual")
      .select("valor, fecha_registro, productos(nombre, formato)")
      .eq("id_comercio", idComercioDestino);
    setPrecios((data as unknown as PrecioVigente[]) ?? []);
  }

  // Card visible: terreno/admin requiere un pin; comercio basta con tener comercio propio.
  const mostrarCard = esComercio ? comercioElegido !== null : seleccionado !== null;
  const nombreDestino = esComercio
    ? (misComercios.find((c) => c.id_comercio === comercioElegido)?.nombre ??
      "Tu comercio")
    : (seleccionado?.nombre ?? "");

  // Evita mostrar los precios del comercio anterior mientras no hay destino.
  const preciosVisibles = idComercioDestino ? precios : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Mapa */}
      <div className="relative min-h-[52vh] flex-1 lg:min-h-0">
        <div ref={divRef} className="absolute inset-0" />

        <div className="pointer-events-none absolute left-3 top-3 z-[500]">
          <div className="flex items-center gap-2 border border-pac-linea bg-white px-3 py-2">
            <Store className="size-3.5 text-pac-azul" aria-hidden="true" />
            <span className="cifra text-[12px] font-bold text-pac-tinta">
              {comercios.length}
            </span>
            <span className="micro text-pac-tinta-suave">comercios</span>
          </div>
        </div>

        {!esComercio && !seleccionado && comercios.length > 0 && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] hidden max-w-xs sm:block">
            <div className="border-l-[3px] border-l-pac-rojo bg-white px-3.5 py-2.5">
              <p className="text-[12px] font-medium leading-snug text-pac-tinta">
                Toca un punto del mapa para ver los precios del comercio.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral */}
      <aside className="flex w-full shrink-0 flex-col border-t border-pac-linea bg-white lg:w-[400px] lg:overflow-y-auto lg:border-l lg:border-t-0">
        {!mostrarCard && (
          <div className="flex flex-1 flex-col justify-center px-6 py-10">
            <Etiqueta className="mb-2 block">Sin selección</Etiqueta>
            <p className="font-slab text-[17px] font-bold leading-snug text-pac-azul">
              Selecciona un comercio en el mapa
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-pac-tinta-suave">
              Cada punto corresponde a un almacén, feria o negocio relevado por
              el municipio. Al elegirlo verás su dirección y los precios
              vigentes.
            </p>
          </div>
        )}

        {mostrarCard && (
          <>
            <header className="border-b border-pac-linea px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-bold leading-snug text-pac-azul">
                    {nombreDestino}
                  </h2>
                  {!esComercio && seleccionado && (
                    <p className="mt-1 text-[12px] leading-snug text-pac-tinta-suave">
                      {seleccionado.direccion}
                    </p>
                  )}
                </div>
                {!esComercio && seleccionado && (
                  <Insignia tono="neutro" className="shrink-0 whitespace-nowrap">
                    {etiquetaTipo(seleccionado.tipo)}
                  </Insignia>
                )}
              </div>
            </header>

            <div className="px-5 py-4">
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="micro text-pac-tinta-suave">Precios vigentes</h3>
                <span className="cifra text-[11px] text-pac-tinta-suave">
                  {preciosVisibles.length}
                </span>
              </div>

              {preciosVisibles.length === 0 ? (
                <p className="border border-dashed border-pac-linea-fuerte px-3 py-4 text-[13px] text-pac-tinta-suave">
                  Sin precios registrados todavía.
                </p>
              ) : (
                <ul className="divide-y divide-pac-linea border-y border-pac-linea">
                  {preciosVisibles.map((p) => (
                    <li
                      key={`${p.productos.nombre}-${p.fecha_registro}`}
                      className="flex items-baseline justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-pac-tinta">
                          {p.productos.nombre}
                        </p>
                        <p className="text-[11px] text-pac-tinta-suave">
                          {p.productos.formato}
                        </p>
                      </div>
                      <p className="cifra shrink-0 font-slab text-[15px] font-bold text-pac-azul">
                        {pesos(p.valor)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {esIngesta && (
              <div className="border-t border-pac-linea bg-pac-fondo/50 px-5 py-4">
                <h3 className="micro mb-3 text-pac-tinta-suave">
                  Registrar precio · {rol}
                </h3>

                {esComercio && (
                  <div className="mb-3">
                    {misComercios.length === 0 ? (
                      <Aviso tono="alerta">
                        No tienes comercios asociados a tu usuario.
                      </Aviso>
                    ) : (
                      <Campo etiqueta="Tu comercio" para="comercio-propio">
                        <Selector
                          id="comercio-propio"
                          value={comercioElegido ?? ""}
                          onChange={(e) =>
                            setComercioElegido(Number(e.target.value))
                          }
                        >
                          {misComercios.map((c) => (
                            <option key={c.id_comercio} value={c.id_comercio}>
                              {c.nombre}
                            </option>
                          ))}
                        </Selector>
                      </Campo>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Campo etiqueta="Producto" para="producto-precio">
                    <Selector
                      id="producto-precio"
                      value={formProducto ?? ""}
                      onChange={(e) =>
                        setFormProducto(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Elige un producto…</option>
                      {productos.map((p) => (
                        <option key={p.id_producto} value={p.id_producto}>
                          {p.nombre} · {p.formato}
                        </option>
                      ))}
                    </Selector>
                  </Campo>

                  <Campo etiqueta="Precio (CLP)" para="valor-precio">
                    <Entrada
                      id="valor-precio"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="1290"
                      value={formValor}
                      onChange={(e) => setFormValor(e.target.value)}
                    />
                  </Campo>

                  <Boton
                    onClick={guardarPrecio}
                    disabled={guardando}
                    bloque
                    variante="primario"
                  >
                    {guardando ? "Guardando…" : "Guardar precio"}
                  </Boton>

                  {mensaje && (
                    <Aviso
                      tono={
                        mensaje.startsWith("Error") ||
                        mensaje.startsWith("Selecciona") ||
                        mensaje.startsWith("El precio")
                          ? "error"
                          : "exito"
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {mensaje === "Precio registrado." && (
                          <Check className="size-3.5" aria-hidden="true" />
                        )}
                        {mensaje}
                      </span>
                    </Aviso>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

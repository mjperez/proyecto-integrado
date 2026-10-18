"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth_provider";

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

export default function MapaComercios() {
    const { perfil } = useAuth();
    const rol = perfil?.roles?.nombre;
    const esComercio = rol === "comercio";
    const esIngesta = perfil ? ROLES_INGESTA.includes(rol ?? "") : false;

    const divRef = useRef<HTMLDivElement>(null);
    const mapaRef = useRef<L.Map | null>(null);

    const [comercios, setComercios] = useState<ComercioMapa[]>([]);
    const [seleccionado, setSeleccionado] = useState<ComercioMapa | null>(null);
    const [precios, setPrecios] = useState<PrecioVigente[]>([]);

    const [productos, setProductos] = useState<Producto[]>([]);
    const [formProducto, setFormProducto] = useState<number | null>(null);
    const [formValor, setFormValor] = useState("");
    const [mensaje, setMensaje] = useState<string | null>(null);

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

        const mapa = L.map(divRef.current).setView([-33.503, -70.7155], 14);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapa);

        mapaRef.current = mapa;
        return () => {
            mapa.remove();
            mapaRef.current = null;
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
            L.circleMarker([c.lat, c.lng], {
                radius: 9,
                color: "#004283",
                fillColor: "#004283",
                fillOpacity: 0.8,
            })
                .addTo(mapa)
                .bindTooltip(c.nombre)
                .on("click", () => setSeleccionado(c));
        });

        mapa.fitBounds(
            L.latLngBounds(comercios.map((c) => [c.lat, c.lng] as [number, number])),
            { padding: [40, 40] }
        );
    }, [comercios]);

    // Comercio destino: el del usuario (comercio) o el clickeado (terreno/admin).
    const idComercioDestino: number | null = esComercio
        ? comercioElegido
        : seleccionado?.id_comercio ?? null;

    // 4. Precios vigentes del comercio destino (el que se muestra y donde se guarda)
    useEffect(() => {
        if (!idComercioDestino) return;
        supabase
            .from("v_precio_actual")
            .select("valor, fecha_registro, productos(nombre, formato)")
            .eq("id_comercio", idComercioDestino)
            .then(({ data }) => setPrecios((data as unknown as PrecioVigente[]) ?? []));
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
                    (data ?? []) as Array<{ id_comercio: number; comercios: { nombre: string } | null }>
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
        // US-C1: el comercio se asocia al del usuario autenticado (rol comercio),
        // no al pin clickeado en el mapa.
        const { error } = await supabase.from("precios").insert({
            id_producto: formProducto,
            id_comercio: idComercioDestino,
            valor,
            fecha_registro: new Date().toISOString(),
        });
        if (error) {
            setMensaje(`Error: ${error.message}`);
            return;
        }
        setMensaje("Precio registrado ✓");
        setFormValor("");
        const { data } = await supabase
            .from("v_precio_actual")
            .select("valor, fecha_registro, productos(nombre, formato)")
            .eq("id_comercio", idComercioDestino);
        setPrecios((data as unknown as PrecioVigente[]) ?? []);
    }

    // Card visible: terreno/admin requiere un pin; comercio basta con tener comercio propio.
    const mostrarCard = esComercio ? comercioElegido !== null : seleccionado !== null;
    const nombreDestino = esComercio
        ? misComercios.find((c) => c.id_comercio === comercioElegido)?.nombre ?? "Tu comercio"
        : seleccionado?.nombre ?? "";

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div ref={divRef} className="min-h-0 w-full flex-1" />

            {mostrarCard && (
                <div className="mt-4 border rounded p-4">
                    <h2 className="font-bold">{nombreDestino}</h2>
                    {!esComercio && seleccionado && (
                        <p className="mb-3 text-sm text-muted-foreground">
                            {seleccionado.tipo} — {seleccionado.direccion}
                        </p>
                    )}

                    <h3 className="font-semibold text-sm mb-1">Precios vigentes</h3>
                    {precios.length === 0 && (
                        <p className="text-sm text-muted-foreground">Sin precios registrados todavía.</p>
                    )}
                    <ul className="mb-3">
                        {precios.map((p) => (
                            <li key={`${p.productos.nombre}-${p.fecha_registro}`} className="text-sm">
                                {p.productos.nombre} {p.productos.formato} —{" "}
                                <strong>${p.valor.toLocaleString("es-CL")}</strong>
                            </li>
                        ))}
                    </ul>

                    {esIngesta && (
                        <div className="border-t pt-3">
                            <h3 className="font-semibold text-sm mb-2">
                                Registrar precio (perfil {rol})
                            </h3>

                            {esComercio && (
                                <div className="mb-2">
                                    <label className="mb-1 block text-sm font-medium">Tu comercio</label>
                                    {misComercios.length === 0 ? (
                                        <p className="text-sm text-pac-naranjo">
                                            No tienes comercios asociados.
                                        </p>
                                    ) : (
                                        <select
                                            className="w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                                            value={comercioElegido ?? ""}
                                            onChange={(e) => setComercioElegido(Number(e.target.value))}
                                        >
                                            {misComercios.map((c) => (
                                                <option key={c.id_comercio} value={c.id_comercio}>
                                                    {c.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <select
                                    className="border rounded p-2 flex-1"
                                    value={formProducto ?? ""}
                                    onChange={(e) => setFormProducto(Number(e.target.value))}
                                >
                                    <option value="">Elige un producto…</option>
                                    {productos.map((p) => (
                                        <option key={p.id_producto} value={p.id_producto}>
                                            {p.nombre} · {p.formato}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    className="border rounded p-2 w-32"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="Precio"
                                    value={formValor}
                                    onChange={(e) => setFormValor(e.target.value)}
                                />
                                <button
                                    className="rounded bg-primary px-4 text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
                                    onClick={guardarPrecio}
                                >
                                    Guardar
                                </button>
                            </div>
                            {mensaje && <p className="text-sm mt-2">{mensaje}</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth_provider";

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
    producto: { nombre: string; formato: string };
};

const ROLES_INGESTA = ["Vendedor", "Administrador"];

export default function MapaComercios() {
    const { perfil } = useAuth();
    const esIngesta = perfil ? ROLES_INGESTA.includes(perfil.rol?.nombre ?? "") : false;

    const divRef = useRef<HTMLDivElement>(null);
    const mapaRef = useRef<L.Map | null>(null);

    const [comercios, setComercios] = useState<ComercioMapa[]>([]);
    const [seleccionado, setSeleccionado] = useState<ComercioMapa | null>(null);
    const [precios, setPrecios] = useState<PrecioVigente[]>([]);

    const [productos, setProductos] = useState<Producto[]>([]);
    const [formProducto, setFormProducto] = useState<number | null>(null);
    const [formValor, setFormValor] = useState("");
    const [mensaje, setMensaje] = useState<string | null>(null);

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

    // 4. Al seleccionar un comercio: traer sus precios vigentes
    useEffect(() => {
        if (!seleccionado) return;
        supabase
            .from("v_precio_actual")
            .select("valor, fecha_registro, producto(nombre, formato)")
            .eq("id_comercio", seleccionado.id_comercio)
            .then(({ data }) => setPrecios((data as unknown as PrecioVigente[]) ?? []));
    }, [seleccionado]);

    // 5. Para la ingesta del vendedor: lista de productos
    useEffect(() => {
        if (!esIngesta || !seleccionado) return;
        supabase
            .from("producto")
            .select("id_producto, nombre, formato")
            .order("nombre")
            .then(({ data }) => setProductos((data as Producto[]) ?? []));
    }, [esIngesta, seleccionado]);

    async function guardarPrecio() {
        if (!seleccionado || !formProducto || formValor === "") return;
        const { error } = await supabase.from("precio").insert({
            id_producto: formProducto,
            id_comercio: seleccionado.id_comercio,
            valor: Number(formValor),
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
            .select("valor, fecha_registro, producto(nombre, formato)")
            .eq("id_comercio", seleccionado.id_comercio);
        setPrecios((data as unknown as PrecioVigente[]) ?? []);
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div ref={divRef} className="min-h-0 w-full flex-1" />

            {seleccionado && (
                <div className="mt-4 border rounded p-4">
                    <h2 className="font-bold">{seleccionado.nombre}</h2>
                    <p className="text-sm text-gray-600 mb-3">
                        {seleccionado.tipo} — {seleccionado.direccion}
                    </p>

                    <h3 className="font-semibold text-sm mb-1">Precios vigentes</h3>
                    {precios.length === 0 && (
                        <p className="text-sm text-gray-500">Sin precios registrados todavía.</p>
                    )}
                    <ul className="mb-3">
                        {precios.map((p) => (
                            <li key={`${p.producto.nombre}-${p.fecha_registro}`} className="text-sm">
                                {p.producto.nombre} {p.producto.formato} —{" "}
                                <strong>${p.valor.toLocaleString("es-CL")}</strong>
                            </li>
                        ))}
                    </ul>

                    {esIngesta && (
                        <div className="border-t pt-3">
                            <h3 className="font-semibold text-sm mb-2">
                                Registrar precio (perfil {perfil?.rol?.nombre})
                            </h3>
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
                                    placeholder="Precio"
                                    value={formValor}
                                    onChange={(e) => setFormValor(e.target.value)}
                                />
                                <button
                                    className="bg-[#004283] text-white rounded px-4"
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
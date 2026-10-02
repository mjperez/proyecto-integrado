"use client";
import { useEffect, useState } from "react";

type Producto = { id_producto: number; nombre: string; marca: string; formato: string };
type Fila = {
  valor: number;
  fecha_registro: string;
  comercio: { nombre: string; direccion: string };
};

export default function Comparador() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabaseProductos().catch((e) => console.error("Error cargando productos:", e));
  }, []);

  async function supabaseProductos() {
    const { data } = await supabase
      .from("producto")
      .select("id_producto, nombre, marca, formato")
      .order("nombre");
    setProductos((data as unknown as Producto[]) ?? []);
  }

  async function comparar(idProducto: number) {
    setSeleccion(idProducto);
    setCargando(true);
    const res = await fetch(`/api/comparador?producto=${idProducto}`);
    const json = (await res.json()) as { precios: Fila[] };
    setFilas(json.precios ?? []);
    setCargando(false);
  }

  const minimo = filas.length ? Math.min(...filas.map((f) => f.valor)) : null;

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold mb-4">Comparador Comunal</h1>

      <select
        className="w-full border rounded p-2 mb-4"
        value={seleccion ?? ""}
        onChange={(e) => comparar(Number(e.target.value))}
      >
        <option value="">Elige un producto…</option>
        {productos.map((p) => (
          <option key={p.id_producto} value={p.id_producto}>
            {p.nombre} {p.marca} · {p.formato}
          </option>
        ))}
      </select>

      {cargando && <p>Buscando precios…</p>}

      {filas.map((f) => (
        <div
          key={`${f.comercio.nombre}-${f.fecha_registro}`}
          className={`flex justify-between border rounded p-3 mb-2 ${f.valor === minimo ? "border-green-600 bg-green-50" : ""
            }`}
        >
          <div>
            <strong>{f.comercio.nombre}</strong>
            <div className="text-sm text-gray-600">{f.comercio.direccion}</div>
          </div>
          <div className="text-right">
            <strong>${f.valor.toLocaleString("es-CL")}</strong>
            {f.valor === minimo && (
              <div className="text-xs text-green-700 font-semibold">más barato</div>
            )}
          </div>
        </div>
      ))}

      {!cargando && seleccion && filas.length === 0 && (
        <p>Sin precios registrados para este producto todavía.</p>
      )}
    </main>
  );
}

import { supabase } from "@/lib/supabase";
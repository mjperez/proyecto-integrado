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
    <main className="mx-auto min-h-screen w-full max-w-xl bg-background p-6">
      <h1 className="mb-4 text-2xl font-bold text-pac-azul">Comparador Comunal</h1>

      <select
        className="mb-4 w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
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
          className={`mb-2 flex justify-between rounded border p-3 ${f.valor === minimo ? "border-pac-verde bg-pac-verde/10" : "border-border"
            }`}
        >
          <div>
            <strong>{f.comercio.nombre}</strong>
            <div className="text-sm text-muted-foreground">{f.comercio.direccion}</div>
          </div>
          <div className="text-right">
            <strong>${f.valor.toLocaleString("es-CL")}</strong>
            {f.valor === minimo && (
              <div className="text-xs font-semibold text-pac-verde">más barato</div>
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
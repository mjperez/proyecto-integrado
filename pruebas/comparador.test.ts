import { config } from "dotenv";
import { describe, expect, it } from "vitest";

config({ path: ".env.local" });

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hayConfig = Boolean(URL_BASE && CLAVE);

type FilaRpc = {
  id_comercio: number;
  comercio: string;
  valor: number;
  distancia_m: number | null;
  ref_origen: string;
  origen: string;
};

/**
 * Sprint 2 contra la base real y con la clave anónima: es la misma situación del
 * vecino que entra al comparador sin registrarse. Comprueba que la función
 * devuelve un precio vigente por comercio, que la distancia se calcula y que el
 * historial es legible sin sesión.
 */
describe.skipIf(!hayConfig)("Comparador público con la clave anónima", () => {
  const cabeceras: Record<string, string> = {
    apikey: CLAVE ?? "",
    Authorization: `Bearer ${CLAVE ?? ""}`,
    "Content-Type": "application/json",
  };

  async function rpc(cuerpo: Record<string, unknown>): Promise<FilaRpc[]> {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/fn_comparador`, {
      method: "POST",
      headers: cabeceras,
      body: JSON.stringify(cuerpo),
    });

    expect(res.status).toBe(200);
    return (await res.json()) as FilaRpc[];
  }

  async function unProductoConPrecios(): Promise<number> {
    const res = await fetch(`${URL_BASE}/rest/v1/v_precio_actual?select=id_producto&limit=1`, {
      headers: cabeceras,
    });
    const filas = (await res.json()) as { id_producto: number }[];
    expect(filas.length).toBeGreaterThan(0);
    return filas[0].id_producto;
  }

  it("devuelve un solo precio por comercio", async () => {
    const producto = await unProductoConPrecios();
    const filas = await rpc({ p_producto: producto });

    const ids = filas.map((f) => f.id_comercio);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ordena por precio de menor a mayor", async () => {
    const producto = await unProductoConPrecios();
    const valores = (await rpc({ p_producto: producto })).map((f) => Number(f.valor));

    expect(valores).toEqual([...valores].sort((a, b) => a - b));
  });

  it("calcula la distancia desde el centroide cuando no hay coordenadas", async () => {
    const producto = await unProductoConPrecios();
    const filas = await rpc({ p_producto: producto });

    expect(filas.every((f) => f.ref_origen === "comuna")).toBe(true);
    expect(filas.every((f) => typeof f.distancia_m === "number")).toBe(true);
  });

  it("usa el punto del vecino cuando se envía", async () => {
    const producto = await unProductoConPrecios();
    const filas = await rpc({
      p_producto: producto,
      p_lat: -33.495,
      p_lng: -70.723,
    });

    expect(filas.every((f) => f.ref_origen === "usuario")).toBe(true);
    // El punto enviado es la coordenada de un comercio del seed: alguno queda a
    // metros, no a cientos.
    expect(Math.min(...filas.map((f) => f.distancia_m ?? Infinity))).toBeLessThan(50);
  });

  it("solo publica precios validados y con valor positivo", async () => {
    const producto = await unProductoConPrecios();
    const filas = await rpc({ p_producto: producto });

    expect(filas.every((f) => Number(f.valor) > 0)).toBe(true);
    expect(filas.every((f) => ["manual", "csv", "ocr", "api"].includes(f.origen))).toBe(true);
  });

  it("devuelve vacío para un producto sin precios", async () => {
    const filas = await rpc({ p_producto: 999999 });

    expect(filas).toEqual([]);
  });

  it("expone el historial del producto sin sesión", async () => {
    const producto = await unProductoConPrecios();
    const res = await fetch(
      `${URL_BASE}/rest/v1/v_historial_precio?select=fecha,promedio,comercios&id_producto=eq.${producto}&order=fecha`,
      { headers: cabeceras },
    );

    expect(res.status).toBe(200);
    const serie = (await res.json()) as { fecha: string; promedio: number; comercios: number }[];
    expect(serie.length).toBeGreaterThan(1);
    expect(serie.every((p) => p.comercios > 0 && p.promedio > 0)).toBe(true);
  });
});

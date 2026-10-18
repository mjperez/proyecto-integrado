import { config } from "dotenv";
import { describe, expect, it } from "vitest";

config({ path: ".env.local" });

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hayConfig = Boolean(URL_BASE && CLAVE);

// Con la clave anónima se comprueba lo que ve un visitante sin sesión: lectura
// pública del catálogo, nada de la auditoría y ninguna escritura. Es la
// verificación de la política RLS del Sprint 1 sin necesitar credenciales.
describe.skipIf(!hayConfig)("RLS con la clave anónima", () => {
  const cabeceras: Record<string, string> = {
    apikey: CLAVE ?? "",
    Authorization: `Bearer ${CLAVE ?? ""}`,
    "Content-Type": "application/json",
  };

  function pedir(ruta: string, init?: RequestInit) {
    return fetch(`${URL_BASE}/rest/v1/${ruta}`, { ...init, headers: cabeceras });
  }

  it("permite leer el catálogo sin sesión", async () => {
    const res = await pedir("categorias?select=id_categoria&limit=1");

    expect(res.status).toBe(200);
  });

  it("permite leer la vista pública del mapa", async () => {
    const res = await pedir("v_comercios_mapa?select=id_comercio&limit=1");

    expect(res.status).toBe(200);
  });

  it("no expone la auditoría sin sesión", async () => {
    const res = await pedir("registros_auditoria?select=id_registro&limit=1");

    // La tabla responde, pero la política deja el resultado vacío.
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("no expone los usuarios sin sesión", async () => {
    const res = await pedir("usuarios?select=email&limit=1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it.each([
    ["categorias", { nombre: "intruso" }],
    [
      "productos",
      { nombre: "intruso", marca: "x", formato: "1 kg", unidad: "kg", id_categoria: 1 },
    ],
    [
      "comercios",
      {
        nombre: "intruso",
        direccion: "calle falsa 1",
        tipo: "almacen",
        ubicacion: "SRID=4326;POINT(-70.7 -33.5)",
      },
    ],
    ["precios", { valor: 100, id_producto: 1, id_comercio: 1 }],
    ["aliases", { alias: "intruso", id_categoria: 1 }],
  ])("rechaza insertar en %s", async (tabla, cuerpo) => {
    const res = await pedir(tabla, {
      method: "POST",
      headers: { ...cabeceras, Prefer: "return=minimal" },
      body: JSON.stringify(cuerpo),
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rechaza borrar categorías", async () => {
    const res = await pedir("categorias?id_categoria=eq.1", {
      method: "DELETE",
      headers: { ...cabeceras, Prefer: "return=minimal" },
    });

    // Sin política de DELETE, PostgREST borra cero filas o responde 401.
    if (res.status < 400) {
      const res2 = await pedir("categorias?select=id_categoria&id_categoria=eq.1");
      expect(await res2.json()).toHaveLength(1);
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
  });
});

import { describe, expect, it } from "vitest";
import { TIPOS_COMERCIO, esTipoValido, etiquetaTipo } from "@/lib/tipos_comercio";
import { UNIDADES_PRODUCTO, esUnidadValida } from "@/lib/unidades_producto";

describe("tipos de comercio", () => {
  // Esta lista está duplicada en el CHECK `comercios_tipo_check` de la
  // migración 0005. El test fija el contrato: si alguien cambia una de las dos
  // y no la otra, la inserción falla en producción con 23514.
  it("coincide exactamente con el CHECK de la base", () => {
    expect(TIPOS_COMERCIO.map((t) => t.valor)).toEqual([
      "almacen",
      "minimarket",
      "supermercado",
      "feria_libre",
      "panaderia",
      "microemprendimiento",
    ]);
  });

  it("acepta los seis valores", () => {
    for (const tipo of TIPOS_COMERCIO) {
      expect(esTipoValido(tipo.valor)).toBe(true);
    }
  });

  it("rechaza variantes con tilde y valores fuera de la lista", () => {
    // "almacén" y "feria" son los valores legacy que la migración 0005
    // normalizó; si vuelven a entrar, el CHECK los rechaza.
    expect(esTipoValido("almacén")).toBe(false);
    expect(esTipoValido("feria")).toBe(false);
    expect(esTipoValido("Almacen")).toBe(false);
    expect(esTipoValido("")).toBe(false);
  });

  it("traduce a etiqueta y cae al valor crudo si no lo conoce", () => {
    expect(etiquetaTipo("feria_libre")).toBe("Feria libre");
    expect(etiquetaTipo("otro")).toBe("otro");
  });
});

describe("unidades de producto", () => {
  it("incluye las unidades que usa el seed", () => {
    for (const unidad of ["un", "kg", "caja"]) {
      expect(esUnidadValida(unidad)).toBe(true);
    }
  });

  it("rechaza mayúsculas y variantes", () => {
    // `unidad` entra en el UNIQUE del producto: "UN" y "un" serían dos filas.
    expect(esUnidadValida("UN")).toBe(false);
    expect(esUnidadValida("kilo")).toBe(false);
    expect(esUnidadValida("")).toBe(false);
  });

  it("no repite unidades", () => {
    expect(new Set(UNIDADES_PRODUCTO).size).toBe(UNIDADES_PRODUCTO.length);
  });
});

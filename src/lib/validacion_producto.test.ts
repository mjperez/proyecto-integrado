import { describe, expect, it } from "vitest";
import { leerProducto, validarProducto } from "@/lib/validacion_producto";

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [clave, valor] of Object.entries(campos)) fd.set(clave, valor);
  return fd;
}

const BASE = {
  nombre: "Pan corriente (marraqueta)",
  marca: "sin marca",
  formato: "1 kg",
  unidad: "kg",
  id_categoria: "4",
};

describe("leerProducto", () => {
  it("recorta los textos y convierte la categoría", () => {
    const d = leerProducto(formulario({ ...BASE, nombre: "  Arroz  " }));

    expect(d.nombre).toBe("Arroz");
    expect(d.idCategoria).toBe(4);
  });

  it("deja la categoría en 0 si el campo viene vacío", () => {
    // Number(null) y Number("") son 0, no NaN: por eso validarProducto rechaza
    // <= 0 y no solo los valores no numéricos.
    const d = leerProducto(formulario({ ...BASE, id_categoria: "" }));

    expect(d.idCategoria).toBe(0);
    expect(validarProducto(d)).toBe("categoria");
  });
});

describe("validarProducto", () => {
  const valido = leerProducto(formulario(BASE));

  it("acepta un producto correcto", () => {
    expect(validarProducto(valido)).toBeNull();
  });

  it("exige nombre, marca y formato", () => {
    expect(validarProducto({ ...valido, nombre: "" })).toBe("incompleto");
    expect(validarProducto({ ...valido, marca: "" })).toBe("incompleto");
    expect(validarProducto({ ...valido, formato: "" })).toBe("incompleto");
  });

  it("rechaza unidades fuera de la lista cerrada", () => {
    expect(validarProducto({ ...valido, unidad: "UN" })).toBe("unidad");
    expect(validarProducto({ ...valido, unidad: "kilo" })).toBe("unidad");
    expect(validarProducto({ ...valido, unidad: "" })).toBe("unidad");
  });

  it("exige una categoría entera y positiva", () => {
    expect(validarProducto({ ...valido, idCategoria: 0 })).toBe("categoria");
    expect(validarProducto({ ...valido, idCategoria: -1 })).toBe("categoria");
    expect(validarProducto({ ...valido, idCategoria: 1.5 })).toBe("categoria");
    expect(validarProducto({ ...valido, idCategoria: NaN })).toBe("categoria");
  });
});

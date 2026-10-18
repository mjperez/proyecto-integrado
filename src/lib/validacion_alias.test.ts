import { describe, expect, it } from "vitest";
import {
  columnas,
  leerDestino,
  normalizarAlias,
  validarAlias,
} from "@/lib/validacion_alias";

describe("leerDestino", () => {
  it("lee una categoría", () => {
    expect(leerDestino("categoria:4")).toEqual({ tipo: "categoria", id: 4 });
  });

  it("lee un producto", () => {
    expect(leerDestino("producto:12")).toEqual({ tipo: "producto", id: 12 });
  });

  it.each([
    [""],
    ["categoria"],
    ["categoria:0"],
    ["categoria:-3"],
    ["categoria:abc"],
    ["producto:1.5"],
    ["otro:1"],
    ["categoria:3:extra"],
    [":4"],
  ])("rechaza %s", (entrada) => {
    expect(leerDestino(entrada)).toBeNull();
  });
});

describe("columnas", () => {
  // El CHECK `alias_un_solo_destino` exige exactamente un destino no nulo.
  it("deja nula la columna que no corresponde", () => {
    expect(columnas({ tipo: "categoria", id: 4 })).toEqual({
      id_categoria: 4,
      id_producto: null,
    });
    expect(columnas({ tipo: "producto", id: 12 })).toEqual({
      id_categoria: null,
      id_producto: 12,
    });
  });
});

describe("normalizarAlias", () => {
  it("recorta y pasa a minúsculas", () => {
    expect(normalizarAlias("  Marraqueta  ")).toBe("marraqueta");
    expect(normalizarAlias("PAN BATIDO")).toBe("pan batido");
  });
});

describe("validarAlias", () => {
  const destino = { tipo: "categoria" as const, id: 4 };

  it("acepta alias y destino válidos", () => {
    expect(validarAlias("marraqueta", destino)).toBeNull();
  });

  it("rechaza alias vacío o demasiado largo", () => {
    expect(validarAlias("", destino)).toBe("alias");
    expect(validarAlias("a".repeat(101), destino)).toBe("alias");
    expect(validarAlias("a".repeat(100), destino)).toBeNull();
  });

  it("exige destino", () => {
    expect(validarAlias("marraqueta", null)).toBe("destino");
  });
});

import { describe, expect, it } from "vitest";
import { parseCsv, parsearPrecio } from "@/lib/csv";

describe("parseCsv", () => {
  it("separa por coma", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("separa por punto y coma cuando la cabecera lo usa", () => {
    expect(parseCsv("a;b;c\n1;2;3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("respeta la coma dentro de comillas", () => {
    expect(parseCsv('nombre,marca\n"Pan, integral",sin marca')).toEqual([
      ["nombre", "marca"],
      ["Pan, integral", "sin marca"],
    ]);
  });

  it("interpreta comillas escapadas", () => {
    expect(parseCsv('a\n"Pan ""grande"""')).toEqual([["a"], ['Pan "grande"']]);
  });

  it("descarta el BOM y los CR de Windows", () => {
    expect(parseCsv("\uFEFFa,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("no inventa una fila con el salto final", () => {
    expect(parseCsv("a,b\n1,2\n")).toHaveLength(2);
  });

  it("devuelve una fila vacía para un archivo vacío", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("parsearPrecio", () => {
  it.each([
    ["1290", 1290],
    ["1290.50", 1290.5],
    ["1290,50", 1290.5],
    [" 1290 ", 1290],
    ["1", 1],
  ])("acepta %s", (entrada, esperado) => {
    expect(parsearPrecio(entrada)).toBe(esperado);
  });

  it.each([
    ["1.290"],
    ["1.290,50"],
    ["1290.555"],
    ["0"],
    ["-500"],
    ["abc"],
    [""],
    ["1e3"],
  ])("rechaza %s", (entrada) => {
    expect(parsearPrecio(entrada)).toBeNull();
  });

  it("rechaza el separador de miles en vez de leer 1,29", () => {
    // Este es el caso peligroso: Number("1.290") daría 1.29 sin avisar.
    expect(parsearPrecio("1.290")).toBeNull();
  });
});

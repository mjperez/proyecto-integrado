import { describe, expect, it } from "vitest";
import {
  ErrorParametro,
  formatearDistancia,
  leerParametrosComparador,
  ordenar,
  recortarSerie,
  resumir,
  variacion,
  type FilaComparador,
  type PuntoHistorial,
} from "@/lib/comparador";

function fila(parcial: Partial<FilaComparador> & { id_comercio: number; valor: number }): FilaComparador {
  return {
    comercio: `Comercio ${parcial.id_comercio}`,
    direccion: `Dirección ${parcial.id_comercio}`,
    tipo: "almacen",
    fecha_registro: "2026-10-27T10:00:00+00:00",
    origen: "manual",
    distancia_m: 500,
    ...parcial,
  };
}

function params(cadena: string) {
  return new URLSearchParams(cadena);
}

describe("leerParametrosComparador", () => {
  it("acepta solo el producto y deja el orden en precio", () => {
    expect(leerParametrosComparador(params("producto=3"))).toEqual({
      producto: 3,
      lat: null,
      lng: null,
      orden: "precio",
    });
  });

  it("acepta lat, lng y orden por distancia", () => {
    const r = leerParametrosComparador(
      params("producto=3&lat=-33.4925&lng=-70.7166&orden=distancia"),
    );

    expect(r.lat).toBeCloseTo(-33.4925);
    expect(r.lng).toBeCloseTo(-70.7166);
    expect(r.orden).toBe("distancia");
  });

  it("cae en precio cuando el orden no se reconoce", () => {
    expect(leerParametrosComparador(params("producto=1&orden=barato")).orden).toBe(
      "precio",
    );
  });

  it("rechaza producto ausente o no numérico", () => {
    expect(() => leerParametrosComparador(params(""))).toThrow(ErrorParametro);
    expect(() => leerParametrosComparador(params("producto=abc"))).toThrow(ErrorParametro);
    expect(() => leerParametrosComparador(params("producto=0"))).toThrow(ErrorParametro);
    expect(() => leerParametrosComparador(params("producto=1.5"))).toThrow(ErrorParametro);
  });

  it("rechaza media coordenada", () => {
    expect(() => leerParametrosComparador(params("producto=1&lat=-33.49"))).toThrow(
      /juntas o no van/,
    );
    expect(() => leerParametrosComparador(params("producto=1&lng=-70.71"))).toThrow(
      /juntas o no van/,
    );
  });

  it("rechaza coordenadas fuera de rango", () => {
    expect(() => leerParametrosComparador(params("producto=1&lat=-91&lng=-70"))).toThrow(
      /lat fuera/,
    );
    expect(() => leerParametrosComparador(params("producto=1&lat=-33&lng=181"))).toThrow(
      /lng fuera/,
    );
    expect(() => leerParametrosComparador(params("producto=1&lat=abc&lng=-70"))).toThrow(
      /lat fuera/,
    );
  });
});

describe("ordenar", () => {
  const filas = [
    fila({ id_comercio: 1, valor: 1500, distancia_m: 900 }),
    fila({ id_comercio: 2, valor: 1200, distancia_m: 300 }),
    fila({ id_comercio: 3, valor: 1350, distancia_m: 1500 }),
    fila({ id_comercio: 4, valor: 1100, distancia_m: null }),
  ];

  it("ordena por precio de menor a mayor", () => {
    expect(ordenar(filas, "precio").map((f) => f.valor)).toEqual([1100, 1200, 1350, 1500]);
  });

  it("ordena por distancia y deja al final los comercios sin coordenadas", () => {
    expect(ordenar(filas, "distancia").map((f) => f.id_comercio)).toEqual([2, 1, 3, 4]);
  });

  it("no muta la lista original", () => {
    const copia = [...filas];
    ordenar(filas, "precio");
    expect(filas).toEqual(copia);
  });

  it("desempata por distancia cuando el precio se repite", () => {
    const empate = [
      fila({ id_comercio: 1, valor: 1000, distancia_m: 800 }),
      fila({ id_comercio: 2, valor: 1000, distancia_m: 200 }),
    ];

    expect(ordenar(empate, "precio").map((f) => f.id_comercio)).toEqual([2, 1]);
  });
});

describe("resumir", () => {
  it("devuelve todo nulo sin filas", () => {
    expect(resumir([])).toEqual({
      comercios: 0,
      minimo: null,
      maximo: null,
      brecha_pct: null,
    });
  });

  it("calcula mínimo, máximo y brecha", () => {
    const r = resumir([fila({ id_comercio: 1, valor: 1000 }), fila({ id_comercio: 2, valor: 1250 })]);

    expect(r).toEqual({ comercios: 2, minimo: 1000, maximo: 1250, brecha_pct: 25 });
  });

  it("marca brecha cero cuando hay un solo comercio", () => {
    expect(resumir([fila({ id_comercio: 1, valor: 1000 })]).brecha_pct).toBe(0);
  });
});

describe("variacion", () => {
  const punto = (fecha: string, promedio: number): PuntoHistorial => ({
    fecha,
    minimo: promedio - 50,
    promedio,
    maximo: promedio + 50,
    comercios: 6,
  });

  it("no inventa variación con un solo punto", () => {
    expect(variacion([punto("2026-10-27", 1200)])).toBeNull();
    expect(variacion([])).toBeNull();
  });

  it("calcula el alza con un decimal", () => {
    expect(variacion([punto("2026-09-01", 1200), punto("2026-10-27", 1254)])).toBe(4.5);
  });

  it("calcula la baja con signo negativo", () => {
    expect(variacion([punto("2026-09-01", 1200), punto("2026-10-27", 1140)])).toBe(-5);
  });

  it("no divide por cero", () => {
    expect(variacion([punto("2026-09-01", 0), punto("2026-10-27", 100)])).toBeNull();
  });
});

describe("recortarSerie", () => {
  const serie = [
    { fecha: "2026-08-01", minimo: 1, promedio: 1, maximo: 1, comercios: 1 },
    { fecha: "2026-10-01", minimo: 1, promedio: 1, maximo: 1, comercios: 1 },
    { fecha: "2026-10-27", minimo: 1, promedio: 1, maximo: 1, comercios: 1 },
  ];

  it("corta contra el último punto, no contra hoy", () => {
    expect(recortarSerie(serie, 30).map((p) => p.fecha)).toEqual([
      "2026-10-01",
      "2026-10-27",
    ]);
  });

  it("conserva la serie completa con una ventana amplia", () => {
    expect(recortarSerie(serie, 365)).toHaveLength(3);
  });

  it("devuelve vacío si la serie viene vacía", () => {
    expect(recortarSerie([], 30)).toEqual([]);
  });
});

describe("formatearDistancia", () => {
  it("usa metros bajo un kilómetro", () => {
    expect(formatearDistancia(450)).toBe("450 m");
    expect(formatearDistancia(0)).toBe("0 m");
    expect(formatearDistancia(999.4)).toBe("999 m");
  });

  it("usa kilómetros con un decimal arriba de mil metros", () => {
    expect(formatearDistancia(1000)).toBe("1,0 km");
    expect(formatearDistancia(1530)).toBe("1,5 km");
  });

  it("declara la ausencia de ubicación", () => {
    expect(formatearDistancia(null)).toBe("sin ubicación");
  });
});

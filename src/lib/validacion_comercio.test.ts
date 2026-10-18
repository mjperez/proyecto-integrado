import { describe, expect, it } from "vitest";
import { CAJA, leerComercio, punto, validarComercio } from "@/lib/validacion_comercio";

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [clave, valor] of Object.entries(campos)) fd.set(clave, valor);
  return fd;
}

const BASE = {
  nombre: "Almacén Doña Rosa",
  direccion: "Av. Padre Esteban Gumucio 1230",
  tipo: "almacen",
  lat: "-33.491",
  lng: "-70.712",
};

describe("leerComercio", () => {
  it("recorta espacios y convierte las coordenadas a número", () => {
    const d = leerComercio(formulario({ ...BASE, nombre: "  Almacén  " }));

    expect(d.nombre).toBe("Almacén");
    expect(d.lat).toBeCloseTo(-33.491);
    expect(d.lng).toBeCloseTo(-70.712);
  });

  it("trata el select de matriz vacío como matriz", () => {
    expect(leerComercio(formulario({ ...BASE, id_matriz: "" })).idMatriz).toBeNull();
  });

  it("convierte el id de matriz a número", () => {
    expect(leerComercio(formulario({ ...BASE, id_matriz: "7" })).idMatriz).toBe(7);
  });

  it("solo marca activo cuando el check viene encendido", () => {
    expect(leerComercio(formulario(BASE)).activo).toBe(false);
    expect(leerComercio(formulario({ ...BASE, activo: "on" })).activo).toBe(true);
  });
});

describe("validarComercio", () => {
  const valido = leerComercio(formulario(BASE));

  it("acepta un comercio correcto", () => {
    expect(validarComercio(valido, null)).toBeNull();
  });

  it("exige nombre y dirección", () => {
    expect(validarComercio({ ...valido, nombre: "" }, null)).toBe("incompleto");
    expect(validarComercio({ ...valido, direccion: "" }, null)).toBe("incompleto");
  });

  it("rechaza tipos fuera del CHECK", () => {
    expect(validarComercio({ ...valido, tipo: "almacén" }, null)).toBe("tipo");
    expect(validarComercio({ ...valido, tipo: "otro" }, null)).toBe("tipo");
  });

  it("rechaza coordenadas fuera de la caja de la comuna", () => {
    expect(validarComercio({ ...valido, lat: 33.491 }, null)).toBe("coordenada");
    expect(validarComercio({ ...valido, lat: -70.712 }, null)).toBe("coordenada");
    expect(validarComercio({ ...valido, lng: -33.491 }, null)).toBe("coordenada");
  });

  it("acepta los bordes de la caja", () => {
    expect(validarComercio({ ...valido, lat: CAJA.latMin, lng: CAJA.lngMin }, null)).toBeNull();
    expect(validarComercio({ ...valido, lat: CAJA.latMax, lng: CAJA.lngMax }, null)).toBeNull();
  });

  it("rechaza un comercio como su propia matriz", () => {
    expect(validarComercio({ ...valido, idMatriz: 5 }, 5)).toBe("matriz");
    expect(validarComercio({ ...valido, idMatriz: 5 }, 6)).toBeNull();
  });

  it("rechaza una matriz no entera", () => {
    expect(validarComercio({ ...valido, idMatriz: 2.5 }, null)).toBe("matriz");
  });
});

describe("punto", () => {
  it("escribe EWKT con longitud primero", () => {
    expect(punto(-33.491, -70.712)).toBe("SRID=4326;POINT(-70.712 -33.491)");
  });
});

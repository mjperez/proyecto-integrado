import { describe, expect, it } from "vitest";
import {
  dentroDeComuna,
  interpretarRespuesta,
  urlGeocodificacion,
} from "./geocodificacion";

describe("dentroDeComuna", () => {
  it("acepta un punto del centro de la comuna", () => {
    expect(dentroDeComuna({ lat: -33.4938, lng: -70.6761 })).toBe(true);
  });

  it("rechaza las coordenadas que estaban en Cerrillos", () => {
    // Eran las del seed antes de la migración 0025.
    expect(dentroDeComuna({ lat: -33.49225, lng: -70.716667 })).toBe(false);
  });

  it("rechaza un punto al norte del límite", () => {
    expect(dentroDeComuna({ lat: -33.4, lng: -70.67 })).toBe(false);
  });

  it("rechaza un punto al este del límite", () => {
    expect(dentroDeComuna({ lat: -33.49, lng: -70.6 })).toBe(false);
  });
});

describe("interpretarRespuesta", () => {
  it("devuelve null si la lista viene vacía", () => {
    expect(interpretarRespuesta([])).toBeNull();
  });

  it("devuelve null si la respuesta no es una lista", () => {
    expect(interpretarRespuesta({ error: "algo" })).toBeNull();
  });

  it("convierte la latitud y la longitud de texto a número", () => {
    const cuerpo = [{ lat: "-33.487920", lon: "-70.665319" }];
    expect(interpretarRespuesta(cuerpo)).toEqual({
      lat: -33.48792,
      lng: -70.665319,
    });
  });

  it("descarta un resultado que cae fuera de la comuna", () => {
    const cuerpo = [{ lat: "-33.5100", lon: "-70.7300" }];
    expect(interpretarRespuesta(cuerpo)).toBeNull();
  });

  it("descarta valores que no son numéricos", () => {
    expect(interpretarRespuesta([{ lat: "sin dato", lon: "x" }])).toBeNull();
  });
});

describe("urlGeocodificacion", () => {
  it("fija la comuna y el país en la consulta", () => {
    const url = urlGeocodificacion("Club Hípico 4216");
    expect(url).toContain("nominatim.openstreetmap.org");

    const parametros = new URL(url).searchParams;
    expect(parametros.get("q")).toBe("Club Hípico 4216, Pedro Aguirre Cerda, Chile");
    expect(parametros.get("countrycodes")).toBe("cl");
  });

  it("recorta los espacios sobrantes de la dirección", () => {
    const parametros = new URL(urlGeocodificacion("  Lazo 1910  ")).searchParams;
    expect(parametros.get("q")).toBe("Lazo 1910, Pedro Aguirre Cerda, Chile");
  });
});

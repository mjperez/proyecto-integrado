// Geocodificación de direcciones contra Nominatim (OpenStreetMap).
//
// La comuna va fija en la consulta y el resultado se descarta si cae fuera de su
// polígono: Nominatim devuelve la mejor coincidencia del país, así que sin el
// filtro una dirección homónima de otra comuna pasa sin avisar.
//
// La lógica vive aparte de la ruta de API para poder probarla sin red.

export const COMUNA = "Pedro Aguirre Cerda";

/**
 * Caja envolvente de la comuna según la relación de OpenStreetMap. Es más
 * estrecha que la CAJA de validación del formulario, que solo descarta errores
 * de tipeo.
 */
export const BBOX_COMUNA = {
  sur: -33.510755,
  norte: -33.4757087,
  oeste: -70.6951773,
  este: -70.6549256,
};

export type Punto = { lat: number; lng: number };

export function dentroDeComuna(punto: Punto): boolean {
  return (
    punto.lat >= BBOX_COMUNA.sur &&
    punto.lat <= BBOX_COMUNA.norte &&
    punto.lng >= BBOX_COMUNA.oeste &&
    punto.lng <= BBOX_COMUNA.este
  );
}

export function urlGeocodificacion(direccion: string): string {
  const parametros = new URLSearchParams({
    q: `${direccion.trim()}, ${COMUNA}, Chile`,
    format: "json",
    limit: "1",
    countrycodes: "cl",
  });
  return `https://nominatim.openstreetmap.org/search?${parametros.toString()}`;
}

/** Traduce la respuesta de Nominatim. Devuelve null si no hay nada usable. */
export function interpretarRespuesta(cuerpo: unknown): Punto | null {
  if (!Array.isArray(cuerpo) || cuerpo.length === 0) return null;

  const primero = cuerpo[0] as { lat?: string; lon?: string } | undefined;
  const lat = Number(primero?.lat);
  const lng = Number(primero?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const punto = { lat, lng };
  return dentroDeComuna(punto) ? punto : null;
}

// Lógica del comparador comunal (US-D1) y del historial (US-D2) que no depende
// de Supabase, para poder probarla sin red y sin sesión.

export type Orden = "precio" | "distancia";

export type FilaComparador = {
  id_comercio: number;
  comercio: string;
  direccion: string;
  tipo: string;
  valor: number;
  fecha_registro: string;
  origen: string;
  distancia_m: number | null;
};

export type ResumenComparador = {
  comercios: number;
  minimo: number | null;
  maximo: number | null;
  brecha_pct: number | null;
};

export type PuntoHistorial = {
  fecha: string;
  minimo: number;
  promedio: number;
  maximo: number;
  comercios: number;
};

/** Error de validación con el mensaje que se devuelve al cliente. */
export class ErrorParametro extends Error {}

/**
 * Lee `?producto=`, `?lat=`, `?lng=` y `?orden=`.
 * Latitud y longitud van juntas o no van: media coordenada no sirve para nada y
 * aceptarla en silencio haría que el vecino viera distancias de otro punto.
 */
export function leerParametrosComparador(params: URLSearchParams): {
  producto: number;
  lat: number | null;
  lng: number | null;
  orden: Orden;
} {
  const producto = Number(params.get("producto"));
  if (!Number.isInteger(producto) || producto <= 0) {
    throw new ErrorParametro("Falta el parámetro ?producto=<id>");
  }

  const textoLat = params.get("lat");
  const textoLng = params.get("lng");
  const hayLat = textoLat !== null && textoLat !== "";
  const hayLng = textoLng !== null && textoLng !== "";

  if (hayLat !== hayLng) {
    throw new ErrorParametro("lat y lng van juntas o no van");
  }

  let lat: number | null = null;
  let lng: number | null = null;

  if (hayLat && hayLng) {
    lat = Number(textoLat);
    lng = Number(textoLng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new ErrorParametro("lat fuera de rango");
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new ErrorParametro("lng fuera de rango");
    }
  }

  const ordenTexto = params.get("orden");
  const orden: Orden = ordenTexto === "distancia" ? "distancia" : "precio";

  return { producto, lat, lng, orden };
}

/**
 * Ordena sin mutar. Con `distancia` las filas sin coordenadas van al final: no
 * se puede prometer cercanía de un comercio que no está georreferenciado.
 */
export function ordenar(filas: FilaComparador[], orden: Orden): FilaComparador[] {
  const copia = [...filas];
  if (orden === "distancia") {
    return copia.sort((a, b) => {
      if (a.distancia_m === null && b.distancia_m === null) return a.valor - b.valor;
      if (a.distancia_m === null) return 1;
      if (b.distancia_m === null) return -1;
      return a.distancia_m - b.distancia_m || a.valor - b.valor;
    });
  }
  return copia.sort((a, b) => a.valor - b.valor || (a.distancia_m ?? 0) - (b.distancia_m ?? 0));
}

/** Brecha porcentual entre el precio más alto y el más bajo de la lista. */
export function resumir(filas: FilaComparador[]): ResumenComparador {
  if (filas.length === 0) {
    return { comercios: 0, minimo: null, maximo: null, brecha_pct: null };
  }
  const valores = filas.map((f) => f.valor);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  return {
    comercios: filas.length,
    minimo,
    maximo,
    brecha_pct: minimo > 0 ? Math.round(((maximo - minimo) / minimo) * 100) : null,
  };
}

/**
 * Variación porcentual entre el primer y el último punto de la serie.
 * Un solo punto no tiene variación; se devuelve null, no 0, para no afirmar
 * que el precio está estable cuando en realidad no hay serie.
 */
export function variacion(serie: PuntoHistorial[]): number | null {
  if (serie.length < 2) return null;
  const primero = serie[0].promedio;
  const ultimo = serie[serie.length - 1].promedio;
  if (primero <= 0) return null;
  return Math.round(((ultimo - primero) / primero) * 1000) / 10;
}

/** Recorta la serie a los últimos `dias` contados desde el último punto. */
export function recortarSerie(serie: PuntoHistorial[], dias: number): PuntoHistorial[] {
  if (serie.length === 0) return serie;
  const ultimo = new Date(serie[serie.length - 1].fecha).getTime();
  const limite = ultimo - dias * 24 * 60 * 60 * 1000;
  return serie.filter((p) => new Date(p.fecha).getTime() >= limite);
}

/** Distancia legible: metros bajo 1 km, kilómetros con un decimal arriba. */
export function formatearDistancia(metros: number | null): string {
  if (metros === null) return "sin ubicación";
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toLocaleString("es-CL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

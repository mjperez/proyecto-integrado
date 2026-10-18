// Validación del mantenedor de comercios, separada de la Server Action para
// poder probarla sin Supabase ni Next.

import { esTipoValido } from "@/lib/tipos_comercio";

// Caja envolvente aproximada de la comuna. No es el límite oficial: descarta
// coordenadas mal tipeadas (signo invertido, latitud y longitud cambiadas de
// lugar) antes de llegar a la BD. La columna es geography(Point,4326), así que
// un punto fuera de rango no lo detecta ningún CHECK.
export const CAJA = { latMin: -33.56, latMax: -33.44, lngMin: -70.78, lngMax: -70.64 };

export type DatosComercio = {
  nombre: string;
  direccion: string;
  tipo: string;
  lat: number;
  lng: number;
  idMatriz: number | null;
  activo: boolean;
};

export function leerComercio(formData: FormData): DatosComercio {
  const idMatrizTexto = String(formData.get("id_matriz") ?? "").trim();

  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    direccion: String(formData.get("direccion") ?? "").trim(),
    tipo: String(formData.get("tipo") ?? "").trim(),
    lat: Number(formData.get("lat")),
    lng: Number(formData.get("lng")),
    idMatriz: idMatrizTexto === "" ? null : Number(idMatrizTexto),
    activo: formData.get("activo") === "on",
  };
}

// Devuelve el código de error para la URL, o null si los datos están bien.
export function validarComercio(d: DatosComercio, idActual: number | null): string | null {
  if (!d.nombre || !d.direccion) return "incompleto";
  if (!esTipoValido(d.tipo)) return "tipo";
  if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return "coordenada";
  if (d.lat < CAJA.latMin || d.lat > CAJA.latMax) return "coordenada";
  if (d.lng < CAJA.lngMin || d.lng > CAJA.lngMax) return "coordenada";
  if (d.idMatriz !== null) {
    if (!Number.isInteger(d.idMatriz)) return "matriz";
    if (d.idMatriz === idActual) return "matriz";
  }
  return null;
}

// geography se escribe como EWKT: longitud primero, latitud después.
export function punto(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

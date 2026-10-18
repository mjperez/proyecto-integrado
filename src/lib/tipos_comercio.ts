// Tipos de comercio del alcance del observatorio. La lista está replicada en
// el CHECK `comercios_tipo_check` de la migración 0005: si se agrega uno, hay
// que migrar. Vive fuera de las Server Actions porque un archivo con
// "use server" solo puede exportar funciones asíncronas.

export const TIPOS_COMERCIO = [
  { valor: "almacen", etiqueta: "Almacén de barrio" },
  { valor: "minimarket", etiqueta: "Minimarket" },
  { valor: "supermercado", etiqueta: "Supermercado" },
  { valor: "feria_libre", etiqueta: "Feria libre" },
  { valor: "panaderia", etiqueta: "Panadería" },
  { valor: "microemprendimiento", etiqueta: "Microemprendimiento" },
] as const;

export type TipoComercio = (typeof TIPOS_COMERCIO)[number]["valor"];

export function esTipoValido(valor: string): valor is TipoComercio {
  return TIPOS_COMERCIO.some((t) => t.valor === valor);
}

export function etiquetaTipo(valor: string): string {
  return TIPOS_COMERCIO.find((t) => t.valor === valor)?.etiqueta ?? valor;
}

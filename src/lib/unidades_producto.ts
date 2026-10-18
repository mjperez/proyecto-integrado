// Unidades de medida del catálogo. `unidad` entra en el UNIQUE del producto,
// así que un typo ("un" contra "UN") fragmenta el catálogo en dos filas
// distintas. El formulario la ofrece como lista cerrada.
// Si aparece una unidad nueva, se agrega acá y no requiere migración.

export const UNIDADES_PRODUCTO = ["un", "kg", "g", "L", "ml", "caja", "docena", "pack"] as const;

export type UnidadProducto = (typeof UNIDADES_PRODUCTO)[number];

export function esUnidadValida(valor: string): valor is UnidadProducto {
  return (UNIDADES_PRODUCTO as readonly string[]).includes(valor);
}

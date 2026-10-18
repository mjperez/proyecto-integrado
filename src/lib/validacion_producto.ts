// Validación del mantenedor de productos, separada de la Server Action para
// poder probarla sin Supabase ni Next.

import { esUnidadValida } from "@/lib/unidades_producto";

export type DatosProducto = {
  nombre: string;
  marca: string;
  formato: string;
  unidad: string;
  idCategoria: number;
  activo: boolean;
};

export function leerProducto(formData: FormData): DatosProducto {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    marca: String(formData.get("marca") ?? "").trim(),
    formato: String(formData.get("formato") ?? "").trim(),
    unidad: String(formData.get("unidad") ?? "").trim(),
    idCategoria: Number(formData.get("id_categoria")),
    activo: formData.get("activo") === "on",
  };
}

export function validarProducto(d: DatosProducto): string | null {
  if (!d.nombre || !d.marca || !d.formato) return "incompleto";
  if (!esUnidadValida(d.unidad)) return "unidad";
  if (!Number.isInteger(d.idCategoria) || d.idCategoria <= 0) return "categoria";
  return null;
}

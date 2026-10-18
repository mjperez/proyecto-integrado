"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { leerProducto, validarProducto } from "@/lib/validacion_producto";

const RUTA = "/admin/productos";

// 23505 unicidad (nombre, marca, formato, unidad); 23503 categoría inexistente;
// 23502 columna obligatoria vacía.
function fallar(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505") redirect(`${RUTA}?error=duplicado`);
  if (error.code === "23503") redirect(`${RUTA}?error=categoria`);
  if (error.code === "23502") redirect(`${RUTA}?error=incompleto`);
  redirect("/sin-acceso");
}

export async function crearProducto(formData: FormData) {
  const supabase = await createClient();
  const datos = leerProducto(formData);
  const problema = validarProducto(datos);
  if (problema) redirect(`${RUTA}?error=${problema}`);

  const { error } = await supabase.from("productos").insert({
    nombre: datos.nombre,
    marca: datos.marca,
    formato: datos.formato,
    unidad: datos.unidad,
    id_categoria: datos.idCategoria,
    activo: datos.activo,
  });

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

export async function actualizarProducto(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect(RUTA);

  const datos = leerProducto(formData);
  const problema = validarProducto(datos);
  if (problema) redirect(`${RUTA}?error=${problema}`);

  const { error } = await supabase
    .from("productos")
    .update({
      nombre: datos.nombre,
      marca: datos.marca,
      formato: datos.formato,
      unidad: datos.unidad,
      id_categoria: datos.idCategoria,
      activo: datos.activo,
    })
    .eq("id_producto", id);

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

// Borrado lógico: los precios referencian el producto y el histórico de precios
// no se puede romper. Reactivar se hace desde la ficha con el check "Activo".
export async function desactivarProducto(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect(RUTA);

  const { error } = await supabase
    .from("productos")
    .update({ activo: false })
    .eq("id_producto", id);

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

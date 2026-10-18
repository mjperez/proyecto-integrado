"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const RUTA = "/admin/categorias";

// La unicidad de nombre ya está en la BD (categorias.nombre unique). Traducimos
// la violación 23505 a un aviso en lugar de rebotar a /sin-acceso.
function fallar(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505") redirect(`${RUTA}?error=duplicado`);
  redirect("/sin-acceso");
}

export async function crearCategoria(formData: FormData) {
  const supabase = await createClient();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const activo = formData.get("activo") === "on";

  if (!nombre) {
    revalidatePath(RUTA);
    return;
  }

  const { error } = await supabase
    .from("categorias")
    .insert({ nombre, descripcion, activo });

  fallar(error);
  redirect(RUTA);
}

export async function actualizarCategoria(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const activo = formData.get("activo") === "on";

  if (!nombre || !Number.isInteger(id)) {
    revalidatePath(RUTA);
    return;
  }

  const { error } = await supabase
    .from("categorias")
    .update({ nombre, descripcion, activo })
    .eq("id_categoria", id);

  fallar(error);
  redirect(RUTA);
}

// US-A3: borrado lógico. Se desactiva (activo=false) en vez de eliminar la fila,
// para no romper las FK de productos/aliases que la referencian.
export async function desactivarCategoria(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    revalidatePath(RUTA);
    return;
  }

  const { error } = await supabase
    .from("categorias")
    .update({ activo: false })
    .eq("id_categoria", id);

  fallar(error);
  redirect(RUTA);
}

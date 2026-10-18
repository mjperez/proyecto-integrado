"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  columnas,
  leerDestino,
  normalizarAlias,
  validarAlias,
} from "@/lib/validacion_alias";

const RUTA = "/admin/aliases";

// 23505 alias repetido (incluye el índice funcional sobre lower(alias));
// 23503 destino inexistente; 23514 CHECK de un solo destino.
function fallar(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505") redirect(`${RUTA}?error=duplicado`);
  if (error.code === "23503") redirect(`${RUTA}?error=destino`);
  if (error.code === "23514") redirect(`${RUTA}?error=destino`);
  redirect("/sin-acceso");
}

export async function crearAlias(formData: FormData) {
  const supabase = await createClient();
  const alias = normalizarAlias(String(formData.get("alias") ?? ""));
  const destino = leerDestino(String(formData.get("destino") ?? ""));
  if (!destino) redirect(`${RUTA}?error=destino`);

  const problema = validarAlias(alias, destino);
  if (problema) redirect(`${RUTA}?error=${problema}`);

  const { error } = await supabase
    .from("aliases")
    .insert({ alias, ...columnas(destino) });

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

export async function actualizarAlias(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect(RUTA);

  const alias = normalizarAlias(String(formData.get("alias") ?? ""));
  const destino = leerDestino(String(formData.get("destino") ?? ""));
  if (!destino) redirect(`${RUTA}?error=destino`);

  const problema = validarAlias(alias, destino);
  if (problema) redirect(`${RUTA}?error=${problema}`);

  const { error } = await supabase
    .from("aliases")
    .update({ alias, ...columnas(destino) })
    .eq("id_alias", id);

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

// Nada referencia la tabla de alias, así que el borrado es físico. No hay
// histórico que romper, a diferencia de productos y comercios.
export async function eliminarAlias(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect(RUTA);

  const { error } = await supabase.from("aliases").delete().eq("id_alias", id);

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

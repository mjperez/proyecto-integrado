"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { leerComercio, punto, validarComercio } from "@/lib/validacion_comercio";

const RUTA = "/admin/comercios";

// 23505 unicidad (nombre,direccion); 23503 matriz inexistente;
// 23514 CHECK de tipo; P0001 trigger de jerarquía.
function fallar(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505") redirect(`${RUTA}?error=duplicado`);
  if (error.code === "23503") redirect(`${RUTA}?error=matriz`);
  if (error.code === "23514") redirect(`${RUTA}?error=tipo`);
  if (error.code === "P0001") redirect(`${RUTA}?error=jerarquia`);
  redirect("/sin-acceso");
}

export async function crearComercio(formData: FormData) {
  const supabase = await createClient();
  const datos = leerComercio(formData);
  const problema = validarComercio(datos, null);
  if (problema) redirect(`${RUTA}?error=${problema}`);

  const { error } = await supabase.from("comercios").insert({
    nombre: datos.nombre,
    direccion: datos.direccion,
    tipo: datos.tipo,
    ubicacion: punto(datos.lat, datos.lng),
    id_matriz: datos.idMatriz,
    activo: datos.activo,
  });

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

export async function actualizarComercio(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect(RUTA);

  const datos = leerComercio(formData);
  const problema = validarComercio(datos, id);
  if (problema) redirect(`${RUTA}?error=${problema}`);

  const { error } = await supabase
    .from("comercios")
    .update({
      nombre: datos.nombre,
      direccion: datos.direccion,
      tipo: datos.tipo,
      ubicacion: punto(datos.lat, datos.lng),
      id_matriz: datos.idMatriz,
      activo: datos.activo,
    })
    .eq("id_comercio", id);

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

// Borrado lógico, igual que categorías: los precios y boletas referencian el
// comercio y el histórico no se puede romper.
export async function desactivarComercio(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect(RUTA);

  const { error } = await supabase
    .from("comercios")
    .update({ activo: false })
    .eq("id_comercio", id);

  fallar(error);
  revalidatePath(RUTA);
  revalidatePath("/admin");
  redirect(RUTA);
}

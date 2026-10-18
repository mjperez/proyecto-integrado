import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function requerirRol(...permitidos: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: fila } = await supabase
    .from("usuarios")
    .select("id_usuario, nombre, email, roles(nombre)")
    .eq("auth_uid", user.id)
    .maybeSingle();

  const rol = fila?.roles?.nombre;

  if (!rol || !permitidos.includes(rol)) redirect("/sin-acceso");

  return { supabase, user, perfil: fila, rol };
}

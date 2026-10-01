import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const idProducto = Number(request.nextUrl.searchParams.get("producto"));

  if (!idProducto) {
    return NextResponse.json(
      { error: "Falta el parámetro ?producto=<id>" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("precio")
    .select("valor, fecha_registro, comercio(nombre, direccion)")
    .eq("id_producto", idProducto)
    .order("valor");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ producto: idProducto, precios: data ?? [] });
}
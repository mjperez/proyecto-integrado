import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recortarSerie, variacion, type PuntoHistorial } from "@/lib/comparador";

export const dynamic = "force-dynamic";

const DIAS_POR_DEFECTO = 120;
const DIAS_MAXIMO = 365;

/**
 * US-D2. Historial público de un producto: serie diaria con el precio vigente de
 * cada comercio, más la variación entre el primer y el último punto.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const producto = Number(params.get("producto"));

  if (!Number.isInteger(producto) || producto <= 0) {
    return NextResponse.json(
      { error: "Falta el parámetro ?producto=<id>" },
      { status: 400 }
    );
  }

  const diasPedidos = Number(params.get("dias"));
  const dias =
    Number.isFinite(diasPedidos) && diasPedidos > 0
      ? Math.min(Math.floor(diasPedidos), DIAS_MAXIMO)
      : DIAS_POR_DEFECTO;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_historial_precio")
    .select("fecha, minimo, promedio, maximo, comercios")
    .eq("id_producto", producto)
    .order("fecha", { ascending: true })
    .limit(400);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const serie = recortarSerie((data ?? []) as PuntoHistorial[], dias);

  return NextResponse.json({
    producto,
    dias,
    serie,
    variacion_pct: variacion(serie),
    desde: serie[0]?.fecha ?? null,
    hasta: serie[serie.length - 1]?.fecha ?? null,
  });
}

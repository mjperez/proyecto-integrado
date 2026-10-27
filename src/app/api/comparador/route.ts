import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  ErrorParametro,
  leerParametrosComparador,
  ordenar,
  resumir,
  type FilaComparador,
} from "@/lib/comparador";

export const dynamic = "force-dynamic";

type FilaRpc = FilaComparador & {
  ref_lat: number | null;
  ref_lng: number | null;
  ref_origen: string | null;
};

/**
 * RF-06 / US-D1. Comparador público: no exige sesión.
 * Devuelve un precio vigente y validado por comercio, ya ordenado, con la
 * distancia al punto del vecino o, si no lo manda, al centroide comunal.
 */
export async function GET(request: NextRequest) {
  let params;
  try {
    params = leerParametrosComparador(request.nextUrl.searchParams);
  } catch (error) {
    if (error instanceof ErrorParametro) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_comparador", {
    p_producto: params.producto,
    p_lat: params.lat ?? undefined,
    p_lng: params.lng ?? undefined,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filas = (data ?? []) as FilaRpc[];
  const precios = ordenar(filas, params.orden);
  const primera = filas[0];

  return NextResponse.json({
    producto: params.producto,
    orden: params.orden,
    referencia: primera
      ? {
          lat: primera.ref_lat ?? null,
          lng: primera.ref_lng ?? null,
          origen: primera.ref_origen ?? "comuna",
        }
      : null,
    resumen: resumir(filas),
    precios,
  });
}

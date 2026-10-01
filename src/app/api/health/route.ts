import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  let db = "error";
  try {
    // consulta mínima: solo probamos que la base responde
    const { error } = await supabase.from("rol").select("id_rol").limit(1);
    db = error ? "error" : "ok";
  } catch {
    db = "error";
  }
  const ok = db === "ok";

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      servicios: { base_datos: db },
      latencia_ms: Date.now() - t0,
      fecha: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 } // 200 = sano, 503 = algo anda mal
  );
}
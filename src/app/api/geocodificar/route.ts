import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { interpretarRespuesta, urlGeocodificacion } from "@/lib/geocodificacion";

// Nominatim pide identificarse con un agente propio y no pasar de una consulta
// por segundo. El proceso de Next reutiliza este módulo entre peticiones, así
// que una marca en memoria basta para respetar el límite.
const AGENTE = "observatorio-precios-pac/1.0 (proyecto academico INACAP)";
let ultimaConsulta = 0;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "sin sesión" }, { status: 401 });
  }

  const direccion = new URL(request.url).searchParams.get("direccion")?.trim();
  if (!direccion || direccion.length < 5) {
    return NextResponse.json({ error: "dirección incompleta" }, { status: 400 });
  }

  const espera = 1000 - (Date.now() - ultimaConsulta);
  if (espera > 0) await new Promise((listo) => setTimeout(listo, espera));
  ultimaConsulta = Date.now();

  try {
    const respuesta = await fetch(urlGeocodificacion(direccion), {
      headers: { "User-Agent": AGENTE, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!respuesta.ok) {
      return NextResponse.json({ error: "servicio no disponible" }, { status: 502 });
    }

    const punto = interpretarRespuesta(await respuesta.json());
    if (!punto) {
      return NextResponse.json({ error: "no encontrada" }, { status: 404 });
    }

    return NextResponse.json(punto);
  } catch {
    return NextResponse.json({ error: "servicio no disponible" }, { status: 502 });
  }
}

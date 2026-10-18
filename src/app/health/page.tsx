"use client";

import { useEffect, useState } from "react";

// Espejo de la respuesta de /api/health. Los campos son opcionales porque el
// catch del fetch solo alcanza a devolver el estado.
type Estado = {
  status: "ok" | "degraded" | "error";
  servicios?: { base_datos: string };
  latencia_ms?: number;
  fecha?: string;
};

export default function Health() {
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((datos: Estado) => setEstado(datos))
      .catch(() => setEstado({ status: "error" }));
  }, []);

  if (!estado) {
    return (
      <main className="min-h-screen bg-pac-gris p-6 text-muted-foreground">
        Consultando…
      </main>
    );
  }

  const ok = estado.status === "ok";

  return (
    <main className="min-h-screen bg-pac-gris p-6">
      <div
        className={`mx-auto max-w-md rounded-lg border p-4 ${
          ok ? "border-pac-verde bg-pac-verde/10" : "border-pac-rojo bg-pac-rojo/10"
        }`}
      >
        <h1 className="text-xl font-bold">
          {ok ? "🟢 Sistema saludable" : "🔴 Problemas detectados"}
        </h1>
        <pre className="mt-2 text-sm">{JSON.stringify(estado, null, 2)}</pre>
      </div>
    </main>
  );
}

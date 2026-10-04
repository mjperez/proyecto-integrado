"use client";
import { useEffect, useState } from "react";

export default function Health() {
  const [estado, setEstado] = useState<any>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setEstado)
      .catch(() => setEstado({ status: "error" }));
  }, []);

  if (!estado) return <main className="min-h-screen bg-pac-gris p-6 text-muted-foreground">Consultando…</main>;
  const ok = estado.status === "ok";

  return (
    <main className="min-h-screen bg-pac-gris p-6">
      <div className={`mx-auto max-w-md rounded-lg border p-4 ${ok ? "border-pac-verde bg-pac-verde/10" : "border-pac-rojo bg-pac-rojo/10"}`}>
        <h1 className="text-xl font-bold">
          {ok ? "🟢 Sistema saludable" : "🔴 Problemas detectados"}
        </h1>
        <pre className="mt-2 text-sm">{JSON.stringify(estado, null, 2)}</pre>
      </div>
    </main>
  );
}
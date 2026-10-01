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

  if (!estado) return <main className="p-6">Consultando…</main>;
  const ok = estado.status === "ok";

  return (
    <main className="mx-auto max-w-md p-6">
      <div className={`border rounded-lg p-4 ${ok ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"}`}>
        <h1 className="text-xl font-bold">
          {ok ? "🟢 Sistema saludable" : "🔴 Problemas detectados"}
        </h1>
        <pre className="mt-2 text-sm">{JSON.stringify(estado, null, 2)}</pre>
      </div>
    </main>
  );
}
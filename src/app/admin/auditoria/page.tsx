import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

const ACCION_ETIQUETA: Record<string, string> = {
  INSERT: "alta",
  UPDATE: "modificación",
  DELETE: "baja",
};

function fechaCorta(valor: string) {
  return new Date(valor).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export default async function AuditoriaPage() {
  const supabase = await createClient();

  const [registros, total, verificacion] = await Promise.all([
    supabase
      .from("registros_auditoria")
      .select(
        "id_registro, tabla, accion, registro_id, fecha, hash, hash_anterior, usuarios(nombre)",
      )
      .order("id_registro", { ascending: false })
      .limit(50),
    supabase
      .from("registros_auditoria")
      .select("*", { count: "exact", head: true }),
    supabase.rpc("fn_verificar_auditoria"),
  ]);

  const lista = registros.data ?? [];
  const rotos = verificacion.data ?? [];
  const integra = !verificacion.error && rotos.length === 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-background p-6">
      <Link
        href="/admin"
        className="text-sm text-pac-celeste transition-colors hover:underline"
      >
        ← Volver al panel
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-pac-azul">Auditoría</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Registro inmutable de cambios sobre precios, encadenado por hash (US-F3).
      </p>

      {verificacion.error ? (
        <p className="mb-4 rounded border border-pac-naranjo bg-pac-naranjo/10 p-3 text-sm text-pac-naranjo">
          No se pudo verificar la cadena: {verificacion.error.message}
        </p>
      ) : integra ? (
        <div className="mb-4 rounded border border-pac-verde bg-pac-verde/10 p-3 text-sm text-pac-verde">
          <strong>Cadena íntegra.</strong> Los {total.count ?? 0} registros encadenan
          con el hash del anterior y cada hash coincide con su recálculo.
        </div>
      ) : (
        <div className="mb-4 rounded border border-pac-rojo bg-pac-rojo/10 p-3 text-sm text-pac-rojo">
          <strong>{rotos.length} eslabón(es) no verifican.</strong> La cadena fue
          alterada en los registros{" "}
          {rotos.map((r) => `#${r.id_registro_roto}`).join(", ")}.
          <ul className="mt-2 list-disc pl-5">
            {rotos.slice(0, 10).map((r) => (
              <li key={r.id_registro_roto}>
                #{r.id_registro_roto}: {r.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Tabla</th>
              <th className="px-3 py-2">Acción</th>
              <th className="px-3 py-2">Registro</th>
              <th className="px-3 py-2">Hash</th>
              <th className="px-3 py-2">Anterior</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id_registro} className="border-t border-border">
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {r.id_registro}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{fechaCorta(r.fecha)}</td>
                <td className="px-3 py-2">{r.usuarios?.nombre ?? "sistema"}</td>
                <td className="px-3 py-2">{r.tabla}</td>
                <td className="px-3 py-2">{ACCION_ETIQUETA[r.accion] ?? r.accion}</td>
                <td className="px-3 py-2 tabular-nums">{r.registro_id ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs" title={r.hash}>
                  {r.hash.slice(0, 12)}…
                </td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {r.hash_anterior ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lista.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Todavía no hay registros de auditoría. Se generan al cargar o modificar
          precios.
        </p>
      )}

      {lista.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Se muestran los últimos {lista.length} registros de {total.count ?? 0}. La
          verificación se ejecuta sobre la cadena completa.
        </p>
      )}
    </main>
  );
}

import { createClient } from "@/utils/supabase/server";
import { Contenedor, EncabezadoPagina } from "@/components/ui/pagina";
import { Aviso } from "@/components/ui/aviso";
import { Insignia } from "@/components/ui/etiqueta";

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

export const metadata = { title: "Auditoría" };

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
    <Contenedor ancho="amplio">
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Auditoría" },
        ]}
        eyebrow="Trazabilidad · US-F3"
        titulo="Auditoría"
        descripcion="Registro inmutable de cambios sobre el catálogo y los precios. Cada fila encadena el hash de la anterior, de modo que alterar un registro rompe la cadena."
      />

      <div className="mt-6">
        {verificacion.error ? (
          <Aviso tono="alerta" titulo="No se pudo verificar la cadena">
            {verificacion.error.message}
          </Aviso>
        ) : integra ? (
          <Aviso
            tono="exito"
            titulo="Cadena íntegra"
            className="items-start"
          >
            Los {total.count ?? 0} registros encadenan con el hash del anterior y
            cada hash coincide con su recálculo.
          </Aviso>
        ) : (
          <Aviso
            tono="error"
            titulo={`${rotos.length} eslabón(es) no verifican`}
          >
            La cadena fue alterada en los registros{" "}
            {rotos.map((r) => `#${r.id_registro_roto}`).join(", ")}.
            <ul className="mt-2 list-disc pl-5">
              {rotos.slice(0, 10).map((r) => (
                <li key={r.id_registro_roto}>
                  #{r.id_registro_roto}: {r.motivo}
                </li>
              ))}
            </ul>
          </Aviso>
        )}
      </div>

      <section className="mt-6 pb-14">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold text-pac-tinta">
            Últimos movimientos
          </h2>
          <span className="micro text-pac-tinta-suave">
            {lista.length} de {total.count ?? 0}
          </span>
        </div>

        <div className="overflow-x-auto border border-pac-linea bg-white">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-pac-linea bg-pac-fondo/70">
                {[
                  "#",
                  "Fecha",
                  "Usuario",
                  "Tabla",
                  "Acción",
                  "Registro",
                  "Hash",
                  "Eslabón previo",
                ].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="micro whitespace-nowrap px-3 py-2.5 text-pac-tinta-suave"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((r) => (
                <tr
                  key={r.id_registro}
                  className="border-b border-pac-linea transition-colors last:border-b-0 hover:bg-pac-fondo/50"
                >
                  <td className="cifra px-3 py-2.5 text-[12px] text-pac-tinta-suave">
                    {r.id_registro}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] text-pac-tinta">
                    {fechaCorta(r.fecha)}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] text-pac-tinta">
                    {r.usuarios?.nombre ?? "sistema"}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] text-pac-tinta">
                    {r.tabla}
                  </td>
                  <td className="px-3 py-2.5">
                    <Insignia
                      tono={
                        r.accion === "DELETE"
                          ? "destacado"
                          : r.accion === "INSERT"
                            ? "activo"
                            : "neutro"
                      }
                    >
                      {ACCION_ETIQUETA[r.accion] ?? r.accion}
                    </Insignia>
                  </td>
                  <td className="cifra px-3 py-2.5 text-[12.5px] text-pac-tinta">
                    {r.registro_id ?? "—"}
                  </td>
                  <td
                    className="px-3 py-2.5 font-mono text-[11px] text-pac-tinta-suave"
                    title={r.hash}
                  >
                    {r.hash.slice(0, 12)}…
                  </td>
                  <td className="cifra px-3 py-2.5 font-mono text-[11px] text-pac-tinta-suave/70">
                    {r.hash_anterior !== null ? `#${r.hash_anterior}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lista.length === 0 && (
          <p className="mt-3 text-[13px] text-pac-tinta-suave">
            Todavía no hay registros de auditoría. Se generan al cargar o
            modificar precios.
          </p>
        )}

        {lista.length > 0 && (
          <p className="mt-3 text-[11px] leading-relaxed text-pac-tinta-suave">
            Se muestran los últimos {lista.length} registros de {total.count ?? 0}.
            La verificación de integridad se ejecuta sobre la cadena completa.
          </p>
        )}
      </section>
    </Contenedor>
  );
}

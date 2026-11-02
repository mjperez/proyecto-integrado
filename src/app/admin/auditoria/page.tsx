import { createClient } from "@/utils/supabase/server";
import { Contenedor, EncabezadoPagina } from "@/components/ui/pagina";
import { Aviso } from "@/components/ui/aviso";
import { Insignia } from "@/components/ui/etiqueta";

const ACCION_ETIQUETA: Record<string, string> = {
  INSERT: "Alta",
  UPDATE: "Modificación",
  DELETE: "Baja",
};

const MODULO_ETIQUETA: Record<string, string> = {
  productos: "Productos",
  categorias: "Categorías",
  comercios: "Comercios",
  aliases: "Aliases",
  precios: "Precios",
  usuarios: "Usuarios",
  roles: "Roles",
};

function fechaCorta(valor: string) {
  return new Date(valor).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
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
  const ultimo = lista[0];

  return (
    <Contenedor ancho="amplio">
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Auditoría" },
        ]}
        eyebrow="Trazabilidad"
        titulo="Auditoría"
        descripcion="Todo cambio en el catálogo y en los precios queda anotado aquí. Las filas no se pueden editar ni borrar: si alguien altera una, la verificación lo detecta."
      />

      <div className="mt-6">
        {verificacion.error ? (
          <Aviso tono="alerta" titulo="No se pudo verificar el registro">
            {verificacion.error.message}
          </Aviso>
        ) : integra ? (
          <Aviso tono="exito" titulo="Sin alteraciones">
            Los {total.count ?? 0} movimientos registrados conservan su sello
            original. La base no se modificó por fuera de la aplicación.
          </Aviso>
        ) : (
          <Aviso tono="error" titulo={`${rotos.length} registro(s) no coinciden`}>
            El contenido de estos movimientos no corresponde a su sello, así que
            la base fue alterada por fuera del sistema.
            <ul className="mt-2 list-disc pl-5">
              {rotos.slice(0, 10).map((r) => (
                <li key={r.id_registro_roto}>
                  Movimiento #{r.id_registro_roto}: {r.motivo}
                </li>
              ))}
            </ul>
          </Aviso>
        )}
      </div>

      <section className="mt-6 pb-14">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-bold text-pac-tinta">
            Últimos movimientos
          </h2>
          <span className="micro text-pac-tinta-suave">
            {ultimo ? `El más reciente: ${fechaCorta(ultimo.fecha)}` : "Sin registros"}
          </span>
        </div>

        <div className="overflow-x-auto border border-pac-linea bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-pac-linea bg-pac-fondo/70">
                {["#", "Fecha", "Quién", "Módulo", "Acción", "Sello"].map((h) => (
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
                    {r.usuarios?.nombre ?? "Sistema"}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] text-pac-tinta">
                    {MODULO_ETIQUETA[r.tabla] ?? r.tabla}
                    {r.registro_id !== null && (
                      <span className="ml-1.5 text-[11px] text-pac-tinta-suave">
                        #{r.registro_id}
                      </span>
                    )}
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
                  <td
                    className="px-3 py-2.5 font-mono text-[11px] text-pac-tinta-suave"
                    title={`Sello completo: ${r.hash}\nEncadena el movimiento #${r.hash_anterior ?? "inicio"}`}
                  >
                    {r.hash.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lista.length === 0 && (
          <p className="mt-3 text-[13px] text-pac-tinta-suave">
            Todavía no hay movimientos. Se generan al cargar o modificar precios.
          </p>
        )}

        {lista.length > 0 && (
          <div className="mt-4 max-w-2xl text-[11.5px] leading-relaxed text-pac-tinta-suave">
            <p>
              El sello es una huella del movimiento: se calcula con su contenido y
              con el sello del movimiento anterior. Cambiar una fila rompe todos
              los sellos que vienen después, y por eso la alteración se nota.
            </p>
            <p className="mt-1.5">
              Se muestran los últimos {lista.length} de {total.count ?? 0}. La
              verificación se ejecuta siempre sobre la cadena completa.
            </p>
          </div>
        )}
      </section>
    </Contenedor>
  );
}

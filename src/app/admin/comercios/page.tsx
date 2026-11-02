import { createClient } from "@/utils/supabase/server";
import { etiquetaTipo } from "@/lib/tipos_comercio";
import { crearComercio, desactivarComercio } from "./acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel, PanelCabecera } from "@/components/ui/panel";
import { Aviso } from "@/components/ui/aviso";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/etiqueta";
import { FormularioComercio } from "@/components/formulario_comercio";

const ERRORES: Record<string, string> = {
  incompleto: "Nombre y dirección son obligatorios.",
  tipo: "El tipo de comercio no es válido.",
  coordenada: "Las coordenadas están fuera de la comuna o no son numéricas.",
  matriz: "La matriz seleccionada no es válida.",
  jerarquia: "Solo se permiten dos niveles: una sucursal no puede ser matriz.",
  duplicado: "Ya existe un comercio con ese nombre y esa dirección.",
};

export const metadata = { title: "Comercios" };

export default async function ComerciosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: comercios } = await supabase
    .from("comercios")
    .select("id_comercio, nombre, direccion, tipo, activo, id_matriz")
    .order("nombre");

  const lista = comercios ?? [];
  const nombrePorId = new Map(lista.map((c) => [c.id_comercio, c.nombre]));
  // Solo una matriz activa puede recibir sucursales nuevas.
  const matrices = lista.filter((c) => c.id_matriz === null && c.activo);
  const activos = lista.filter((c) => c.activo).length;

  return (
    <Contenedor>
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Comercios" },
        ]}
        eyebrow="Puntos de venta"
        titulo="Comercios"
        descripcion={`${lista.length} comercios registrados, ${activos} activos. Almacenes, ferias, minimarkets y microemprendimientos de la comuna, con matriz y sucursales.`}
      />

      {error && ERRORES[error] && (
        <Aviso tono="error" className="mt-6">
          {ERRORES[error]}
        </Aviso>
      )}

      <div className="mt-6 grid gap-6 pb-14 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
        <div className="order-2 lg:order-1 lg:sticky lg:top-32">
          <Panel acento="azul">
            <PanelCabecera
              titulo="Nuevo comercio"
              descripcion="Escribe la dirección y el sistema calcula la ubicación."
            />
            <FormularioComercio
              accion={crearComercio}
              matrices={matrices}
              textoBoton="Crear comercio"
            />
          </Panel>
        </div>

        <section className="order-1 min-w-0 lg:order-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-pac-tinta">
              Comercios registrados
            </h2>
            <span className="micro text-pac-tinta-suave">{lista.length} filas</span>
          </div>

          {lista.length === 0 ? (
            <EstadoVacio
              titulo="No hay comercios todavía"
              descripcion="Sin comercios no se pueden cargar precios ni poblar el mapa público."
            />
          ) : (
            <ul className="divide-y divide-pac-linea border-y border-pac-linea bg-white">
              {lista.map((c) => (
                <li
                  key={c.id_comercio}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-bold leading-snug text-pac-tinta">
                        {c.nombre}
                      </p>
                      <Insignia tono={c.activo ? "activo" : "inactivo"}>
                        {c.activo ? "Activo" : "Inactivo"}
                      </Insignia>
                      <Insignia>{etiquetaTipo(c.tipo)}</Insignia>
                    </div>
                    <p className="mt-1 text-[12px] text-pac-tinta-suave">
                      {c.direccion}
                      {c.id_matriz !== null && (
                        <>
                          <span className="mx-1.5 text-pac-linea-fuerte">|</span>
                          Sucursal de{" "}
                          {nombrePorId.get(c.id_matriz) ?? `#${c.id_matriz}`}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <BotonEnlace
                      href={`/admin/comercios/${c.id_comercio}/editar`}
                      tamano="sm"
                      variante="contorno"
                    >
                      Editar
                    </BotonEnlace>
                    {c.activo && (
                      <form action={desactivarComercio}>
                        <input type="hidden" name="id" value={c.id_comercio} />
                        <Boton type="submit" tamano="sm" variante="peligro">
                          Desactivar
                        </Boton>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Contenedor>
  );
}

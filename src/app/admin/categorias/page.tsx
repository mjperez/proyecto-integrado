import { createClient } from "@/utils/supabase/server";
import { crearCategoria, desactivarCategoria } from "./acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel, PanelCabecera } from "@/components/ui/panel";
import { Aviso } from "@/components/ui/aviso";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Casilla, Entrada } from "@/components/ui/campo";
import { Insignia } from "@/components/ui/etiqueta";

export const metadata = { title: "Categorías" };

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("id_categoria, nombre, descripcion, activo")
    .order("nombre");

  const lista = categorias ?? [];
  const activas = lista.filter((c) => c.activo).length;

  return (
    <Contenedor>
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Categorías" },
        ]}
        eyebrow="Catálogo maestro · US-A3"
        titulo="Categorías"
        descripcion={`${lista.length} categorías registradas, ${activas} activas. Agrupan el catálogo y sirven de destino para los aliases.`}
      />

      {error === "duplicado" && (
        <Aviso tono="error" className="mt-6">
          Ya existe una categoría con ese nombre.
        </Aviso>
      )}

      <div className="mt-6 grid gap-6 pb-14 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        <div className="order-2 lg:order-1 lg:sticky lg:top-32">
          <Panel acento="azul">
            <PanelCabecera
              titulo="Nueva categoría"
              descripcion="Nombre visible en el comparador público."
            />
            <form action={crearCategoria} className="flex flex-col gap-3.5 p-5">
              <Campo etiqueta="Nombre" para="nombre" requerido>
                <Entrada
                  id="nombre"
                  name="nombre"
                  required
                  placeholder="Panadería y pastas"
                />
              </Campo>

              <Campo
                etiqueta="Descripción"
                para="descripcion"
                ayuda="Opcional. Aparece como apoyo en la ficha de la categoría."
              >
                <Entrada
                  id="descripcion"
                  name="descripcion"
                  placeholder="Productos de panadería y masas"
                />
              </Campo>

              <Casilla etiqueta="Activa" name="activo" defaultChecked />

              <Boton type="submit" bloque className="mt-1">
                Crear categoría
              </Boton>
            </form>
          </Panel>
        </div>

        <section className="order-1 min-w-0 lg:order-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-pac-tinta">
              Categorías registradas
            </h2>
            <span className="micro text-pac-tinta-suave">{lista.length} filas</span>
          </div>

          {lista.length === 0 ? (
            <EstadoVacio
              titulo="No hay categorías todavía"
              descripcion="La categoría es el primer eslabón del catálogo: sin ella no se pueden crear productos ni aliases."
            />
          ) : (
            <ul className="divide-y divide-pac-linea border-y border-pac-linea bg-white">
              {lista.map((c) => (
                <li
                  key={c.id_categoria}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-bold leading-snug text-pac-tinta">
                        {c.nombre}
                      </p>
                      <Insignia tono={c.activo ? "activo" : "inactivo"}>
                        {c.activo ? "Activa" : "Inactiva"}
                      </Insignia>
                    </div>
                    {c.descripcion && (
                      <p className="mt-1 text-[12px] text-pac-tinta-suave">
                        {c.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <BotonEnlace
                      href={`/admin/categorias/${c.id_categoria}/editar`}
                      tamano="sm"
                      variante="contorno"
                    >
                      Editar
                    </BotonEnlace>
                    <form action={desactivarCategoria}>
                      <input type="hidden" name="id" value={c.id_categoria} />
                      <Boton type="submit" tamano="sm" variante="peligro">
                        Desactivar
                      </Boton>
                    </form>
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

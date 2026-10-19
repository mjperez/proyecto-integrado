import { createClient } from "@/utils/supabase/server";
import { actualizarCategoria } from "../../acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel } from "@/components/ui/panel";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Casilla, Entrada } from "@/components/ui/campo";

export const metadata = { title: "Editar categoría" };

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: categoria } = await supabase
    .from("categorias")
    .select("id_categoria, nombre, descripcion, activo")
    .eq("id_categoria", Number(id))
    .single();

  if (!categoria) {
    return (
      <Contenedor ancho="angosto">
        <div className="py-14">
          <EstadoVacio
            titulo="Categoría no encontrada"
            descripcion="El identificador de la URL no corresponde a ninguna categoría del catálogo."
            accion={
              <BotonEnlace href="/admin/categorias" variante="contorno" tamano="sm">
                Volver a categorías
              </BotonEnlace>
            }
          />
        </div>
      </Contenedor>
    );
  }

  return (
    <Contenedor ancho="angosto">
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Categorías", href: "/admin/categorias" },
          { etiqueta: "Editar" },
        ]}
        eyebrow={`Categoría #${categoria.id_categoria}`}
        titulo="Editar categoría"
        descripcion="Renombrar una categoría afecta cómo se agrupa el catálogo en el comparador público."
      />

      <Panel acento="azul" className="my-8">
        <form action={actualizarCategoria}>
          <input type="hidden" name="id" value={categoria.id_categoria} />

          <div className="flex flex-col gap-4 p-5">
            <Campo etiqueta="Nombre" para="nombre" requerido>
              <Entrada
                id="nombre"
                name="nombre"
                required
                defaultValue={categoria.nombre}
              />
            </Campo>

            <Campo etiqueta="Descripción" para="descripcion" ayuda="Opcional.">
              <Entrada
                id="descripcion"
                name="descripcion"
                defaultValue={categoria.descripcion ?? ""}
                placeholder="Productos de panadería y masas"
              />
            </Campo>

            <Casilla
              etiqueta="Activa"
              name="activo"
              defaultChecked={categoria.activo}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-pac-linea bg-pac-fondo/50 px-5 py-3.5">
            <BotonEnlace href="/admin/categorias" variante="fantasma">
              Cancelar
            </BotonEnlace>
            <Boton type="submit">Guardar cambios</Boton>
          </div>
        </form>
      </Panel>
    </Contenedor>
  );
}

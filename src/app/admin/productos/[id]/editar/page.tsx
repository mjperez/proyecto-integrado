import { createClient } from "@/utils/supabase/server";
import { UNIDADES_PRODUCTO } from "@/lib/unidades_producto";
import { actualizarProducto } from "../../acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel } from "@/components/ui/panel";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Casilla, Entrada, Selector } from "@/components/ui/campo";

export const metadata = { title: "Editar producto" };

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: producto }, { data: categorias }] = await Promise.all([
    supabase
      .from("productos")
      .select("id_producto, nombre, marca, formato, unidad, id_categoria, activo")
      .eq("id_producto", Number(id))
      .maybeSingle(),
    supabase.from("categorias").select("id_categoria, nombre, activo").order("nombre"),
  ]);

  if (!producto) {
    return (
      <Contenedor ancho="angosto">
        <div className="py-14">
          <EstadoVacio
            titulo="Producto no encontrado"
            descripcion="El identificador de la URL no corresponde a ningún producto del catálogo."
            accion={
              <BotonEnlace href="/admin/productos" variante="contorno" tamano="sm">
                Volver al catálogo
              </BotonEnlace>
            }
          />
        </div>
      </Contenedor>
    );
  }

  // La categoría actual se ofrece aunque esté inactiva, para no cambiar el
  // producto de categoría sin querer al guardar.
  const opcionesCategoria = (categorias ?? []).filter(
    (c) => c.activo || c.id_categoria === producto.id_categoria,
  );

  // Si el producto trae una unidad fuera de la lista (carga antigua), se agrega
  // como opción para no alterarla al guardar.
  const unidades = (UNIDADES_PRODUCTO as readonly string[]).includes(producto.unidad)
    ? UNIDADES_PRODUCTO
    : [...UNIDADES_PRODUCTO, producto.unidad];

  return (
    <Contenedor ancho="angosto">
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Productos", href: "/admin/productos" },
          { etiqueta: "Editar" },
        ]}
        eyebrow={`Producto #${producto.id_producto}`}
        titulo="Editar producto"
        descripcion="Los cambios sobre el catálogo quedan registrados en la cadena de auditoría."
      />

      <Panel acento="azul" className="my-8">
        <form action={actualizarProducto}>
          <input type="hidden" name="id" value={producto.id_producto} />

          <div className="flex flex-col gap-4 p-5">
            <Campo etiqueta="Nombre" para="nombre" requerido>
              <Entrada
                id="nombre"
                name="nombre"
                required
                defaultValue={producto.nombre}
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Marca" para="marca" requerido>
                <Entrada id="marca" name="marca" required defaultValue={producto.marca} />
              </Campo>
              <Campo etiqueta="Formato" para="formato" requerido>
                <Entrada
                  id="formato"
                  name="formato"
                  required
                  defaultValue={producto.formato}
                />
              </Campo>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Unidad" para="unidad" requerido>
                <Selector
                  id="unidad"
                  name="unidad"
                  required
                  defaultValue={producto.unidad}
                >
                  {unidades.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Selector>
              </Campo>

              <Campo etiqueta="Categoría" para="id_categoria" requerido>
                <Selector
                  id="id_categoria"
                  name="id_categoria"
                  required
                  defaultValue={producto.id_categoria}
                >
                  {opcionesCategoria.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre}
                      {c.activo ? "" : " (inactiva)"}
                    </option>
                  ))}
                </Selector>
              </Campo>
            </div>

            <Casilla
              etiqueta="Activo"
              name="activo"
              defaultChecked={producto.activo}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-pac-linea bg-pac-fondo/50 px-5 py-3.5">
            <BotonEnlace href="/admin/productos" variante="fantasma">
              Cancelar
            </BotonEnlace>
            <Boton type="submit">Guardar cambios</Boton>
          </div>
        </form>
      </Panel>
    </Contenedor>
  );
}

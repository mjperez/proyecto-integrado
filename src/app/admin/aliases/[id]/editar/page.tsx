import { createClient } from "@/utils/supabase/server";
import { actualizarAlias } from "../../acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel } from "@/components/ui/panel";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Entrada, Selector } from "@/components/ui/campo";

export const metadata = { title: "Editar alias" };

export default async function EditarAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: alias }, { data: categorias }, { data: productos }] =
    await Promise.all([
      supabase
        .from("aliases")
        .select("id_alias, alias, id_categoria, id_producto")
        .eq("id_alias", Number(id))
        .maybeSingle(),
      supabase.from("categorias").select("id_categoria, nombre, activo").order("nombre"),
      supabase
        .from("productos")
        .select("id_producto, nombre, marca, formato, activo")
        .order("nombre"),
    ]);

  if (!alias) {
    return (
      <Contenedor ancho="angosto">
        <div className="py-14">
          <EstadoVacio
            titulo="Alias no encontrado"
            descripcion="El identificador de la URL no corresponde a ningún alias registrado."
            accion={
              <BotonEnlace href="/admin/aliases" variante="contorno" tamano="sm">
                Volver a aliases
              </BotonEnlace>
            }
          />
        </div>
      </Contenedor>
    );
  }

  // El destino actual se ofrece aunque esté inactivo, para no mover el alias
  // sin querer al guardar.
  const opcionesCategoria = (categorias ?? []).filter(
    (c) => c.activo || c.id_categoria === alias.id_categoria,
  );
  const opcionesProducto = (productos ?? []).filter(
    (p) => p.activo || p.id_producto === alias.id_producto,
  );

  const destinoActual =
    alias.id_categoria !== null
      ? `categoria:${alias.id_categoria}`
      : `producto:${alias.id_producto}`;

  return (
    <Contenedor ancho="angosto">
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Aliases", href: "/admin/aliases" },
          { etiqueta: "Editar" },
        ]}
        eyebrow={`Alias #${alias.id_alias}`}
        titulo="Editar alias"
        descripcion="Cambiar el destino de un alias altera cómo se normaliza ese nombre en la ingesta."
      />

      <Panel acento="azul" className="my-8">
        <form action={actualizarAlias}>
          <input type="hidden" name="id" value={alias.id_alias} />

          <div className="flex flex-col gap-4 p-5">
            <Campo etiqueta="Alias" para="alias" requerido>
              <Entrada
                id="alias"
                name="alias"
                required
                maxLength={100}
                defaultValue={alias.alias}
              />
            </Campo>

            <Campo etiqueta="Apunta a" para="destino" requerido>
              <Selector
                id="destino"
                name="destino"
                required
                defaultValue={destinoActual}
              >
                {opcionesCategoria.length > 0 && (
                  <optgroup label="Categorías">
                    {opcionesCategoria.map((c) => (
                      <option
                        key={`c-${c.id_categoria}`}
                        value={`categoria:${c.id_categoria}`}
                      >
                        {c.nombre}
                        {c.activo ? "" : " (inactiva)"}
                      </option>
                    ))}
                  </optgroup>
                )}
                {opcionesProducto.length > 0 && (
                  <optgroup label="Productos">
                    {opcionesProducto.map((p) => (
                      <option
                        key={`p-${p.id_producto}`}
                        value={`producto:${p.id_producto}`}
                      >
                        {p.nombre} · {p.marca} · {p.formato}
                        {p.activo ? "" : " (inactivo)"}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Selector>
            </Campo>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-pac-linea bg-pac-fondo/50 px-5 py-3.5">
            <BotonEnlace href="/admin/aliases" variante="fantasma">
              Cancelar
            </BotonEnlace>
            <Boton type="submit">Guardar cambios</Boton>
          </div>
        </form>
      </Panel>
    </Contenedor>
  );
}

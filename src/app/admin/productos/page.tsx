import { createClient } from "@/utils/supabase/server";
import { UNIDADES_PRODUCTO } from "@/lib/unidades_producto";
import { crearProducto, desactivarProducto } from "./acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel, PanelCabecera } from "@/components/ui/panel";
import { Aviso } from "@/components/ui/aviso";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Casilla, Entrada, Selector } from "@/components/ui/campo";
import { Insignia } from "@/components/ui/etiqueta";

const ERRORES: Record<string, string> = {
  incompleto: "Nombre, marca y formato son obligatorios.",
  unidad: "La unidad no es válida.",
  categoria: "Selecciona una categoría válida.",
  duplicado:
    "Ya existe un producto con ese nombre, marca, formato y unidad. Si lo retiraste, reactívalo desde su ficha.",
};

export const metadata = { title: "Productos" };

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [productos, categorias] = await Promise.all([
    supabase
      .from("productos")
      .select("id_producto, nombre, marca, formato, unidad, activo, categorias(nombre)")
      .order("nombre"),
    supabase
      .from("categorias")
      .select("id_categoria, nombre")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const lista = productos.data ?? [];
  const categoriasActivas = categorias.data ?? [];
  const activos = lista.filter((p) => p.activo).length;

  return (
    <Contenedor>
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Productos" },
        ]}
        eyebrow="Catálogo maestro · US-A1"
        titulo="Productos"
        descripcion={`${lista.length} productos registrados, ${activos} activos. Cada producto se identifica por nombre, marca, formato y unidad.`}
      />

      {error && ERRORES[error] && (
        <Aviso tono="error" className="mt-6">
          {ERRORES[error]}
        </Aviso>
      )}

      <div className="mt-6 grid gap-6 pb-14 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        {/* Alta */}
        <div className="order-2 lg:order-1 lg:sticky lg:top-32">
          {categoriasActivas.length === 0 ? (
            <Aviso tono="alerta" titulo="Falta el primer paso">
              No hay categorías activas. Crea una antes de dar de alta
              productos.
              <div className="mt-3">
                <BotonEnlace href="/admin/categorias" tamano="sm" variante="contorno">
                  Ir a categorías
                </BotonEnlace>
              </div>
            </Aviso>
          ) : (
            <Panel acento="azul">
              <PanelCabecera
                titulo="Nuevo producto"
                descripcion="Se incorpora al catálogo con estado activo."
              />
              <form action={crearProducto} className="flex flex-col gap-3.5 p-5">
                <Campo etiqueta="Nombre" para="nombre" requerido>
                  <Entrada
                    id="nombre"
                    name="nombre"
                    required
                    placeholder="Pan corriente (marraqueta)"
                  />
                </Campo>

                <div className="grid grid-cols-2 gap-3">
                  <Campo etiqueta="Marca" para="marca" requerido>
                    <Entrada
                      id="marca"
                      name="marca"
                      required
                      placeholder="sin marca"
                    />
                  </Campo>
                  <Campo etiqueta="Formato" para="formato" requerido>
                    <Entrada id="formato" name="formato" required placeholder="1 kg" />
                  </Campo>
                </div>

                <Campo etiqueta="Unidad" para="unidad" requerido>
                  <Selector id="unidad" name="unidad" required defaultValue="">
                    <option value="" disabled>
                      Selecciona una unidad
                    </option>
                    {UNIDADES_PRODUCTO.map((u) => (
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
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona una categoría
                    </option>
                    {categoriasActivas.map((c) => (
                      <option key={c.id_categoria} value={c.id_categoria}>
                        {c.nombre}
                      </option>
                    ))}
                  </Selector>
                </Campo>

                <Casilla etiqueta="Activo" name="activo" defaultChecked />

                <Boton type="submit" bloque className="mt-1">
                  Crear producto
                </Boton>
              </form>
            </Panel>
          )}
        </div>

        {/* Listado */}
        <section className="order-1 min-w-0 lg:order-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-pac-tinta">
              Catálogo registrado
            </h2>
            <span className="micro text-pac-tinta-suave">{lista.length} filas</span>
          </div>

          {lista.length === 0 ? (
            <EstadoVacio
              titulo="El catálogo está vacío"
              descripcion="Crea la primera categoría y luego el primer producto. Los precios se cargan contra este catálogo, así que sin productos no hay nada que comparar."
            />
          ) : (
            <ul className="divide-y divide-pac-linea border-y border-pac-linea bg-white">
              {lista.map((p) => (
                <li
                  key={p.id_producto}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-bold leading-snug text-pac-tinta">
                        {p.nombre}
                      </p>
                      <Insignia tono={p.activo ? "activo" : "inactivo"}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </Insignia>
                    </div>
                    <p className="mt-1 text-[12px] text-pac-tinta-suave">
                      {p.marca} · {p.formato} · {p.unidad}
                      <span className="mx-1.5 text-pac-linea-fuerte">|</span>
                      <span className="text-pac-azul">
                        {p.categorias?.nombre ?? "Sin categoría"}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <BotonEnlace
                      href={`/admin/productos/${p.id_producto}/editar`}
                      tamano="sm"
                      variante="contorno"
                    >
                      Editar
                    </BotonEnlace>
                    {p.activo && (
                      <form action={desactivarProducto}>
                        <input type="hidden" name="id" value={p.id_producto} />
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

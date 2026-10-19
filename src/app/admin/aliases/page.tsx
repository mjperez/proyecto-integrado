import { createClient } from "@/utils/supabase/server";
import { crearAlias, eliminarAlias } from "./acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel, PanelCabecera } from "@/components/ui/panel";
import { Aviso } from "@/components/ui/aviso";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Entrada, Selector } from "@/components/ui/campo";
import { Insignia } from "@/components/ui/etiqueta";

const ERRORES: Record<string, string> = {
  alias: "El alias no puede estar vacío ni superar los 100 caracteres.",
  destino: "Selecciona una categoría o un producto de destino.",
  duplicado: "Ese alias ya existe. Cada alias apunta a un solo destino.",
};

export const metadata = { title: "Aliases" };

export default async function AliasesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [aliases, categorias, productos] = await Promise.all([
    supabase
      .from("aliases")
      .select(
        "id_alias, alias, id_categoria, id_producto, categorias(nombre), productos(nombre, marca, formato)",
      )
      .order("alias"),
    supabase
      .from("categorias")
      .select("id_categoria, nombre")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("productos")
      .select("id_producto, nombre, marca, formato")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const lista = aliases.data ?? [];
  const categoriasActivas = categorias.data ?? [];
  const productosActivos = productos.data ?? [];
  const sinDestinos =
    categoriasActivas.length === 0 && productosActivos.length === 0;

  return (
    <Contenedor>
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Aliases" },
        ]}
        eyebrow="Normalización · US-A2"
        titulo="Aliases"
        descripcion={`${lista.length} sinónimos registrados. Cada alias resuelve un nombre del habla local contra una categoría o un producto canónico.`}
      />

      {error && ERRORES[error] && (
        <Aviso tono="error" className="mt-6">
          {ERRORES[error]}
        </Aviso>
      )}

      <div className="mt-6 grid gap-6 pb-14 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        <div className="order-2 lg:order-1 lg:sticky lg:top-32">
          {sinDestinos ? (
            <Aviso tono="alerta" titulo="No hay destinos disponibles">
              Un alias debe apuntar a una categoría o a un producto. Crea uno
              primero.
              <div className="mt-3 flex flex-wrap gap-2">
                <BotonEnlace href="/admin/categorias" tamano="sm" variante="contorno">
                  Categorías
                </BotonEnlace>
                <BotonEnlace href="/admin/productos" tamano="sm" variante="contorno">
                  Productos
                </BotonEnlace>
              </div>
            </Aviso>
          ) : (
            <Panel acento="azul">
              <PanelCabecera
                titulo="Nuevo alias"
                descripcion="El nombre tal como lo escribe o lo dice el vecino."
              />
              <form action={crearAlias} className="flex flex-col gap-3.5 p-5">
                <Campo
                  etiqueta="Alias"
                  para="alias"
                  requerido
                  ayuda="Máximo 100 caracteres."
                >
                  <Entrada
                    id="alias"
                    name="alias"
                    required
                    maxLength={100}
                    placeholder="marraqueta"
                  />
                </Campo>

                <Campo etiqueta="Apunta a" para="destino" requerido>
                  <Selector id="destino" name="destino" required defaultValue="">
                    <option value="" disabled>
                      Selecciona un destino
                    </option>
                    {categoriasActivas.length > 0 && (
                      <optgroup label="Categorías">
                        {categoriasActivas.map((c) => (
                          <option
                            key={`c-${c.id_categoria}`}
                            value={`categoria:${c.id_categoria}`}
                          >
                            {c.nombre}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {productosActivos.length > 0 && (
                      <optgroup label="Productos">
                        {productosActivos.map((p) => (
                          <option
                            key={`p-${p.id_producto}`}
                            value={`producto:${p.id_producto}`}
                          >
                            {p.nombre} · {p.marca} · {p.formato}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Selector>
                </Campo>

                <Boton type="submit" bloque className="mt-1">
                  Crear alias
                </Boton>
              </form>
            </Panel>
          )}
        </div>

        <section className="order-1 min-w-0 lg:order-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-pac-tinta">
              Sinónimos registrados
            </h2>
            <span className="micro text-pac-tinta-suave">{lista.length} filas</span>
          </div>

          {lista.length === 0 ? (
            <EstadoVacio
              titulo="No hay aliases todavía"
              descripcion="Los aliases permiten que una búsqueda escrita como se habla en la comuna encuentre el producto correcto del catálogo."
            />
          ) : (
            <ul className="divide-y divide-pac-linea border-y border-pac-linea bg-white">
              {lista.map((a) => (
                <li
                  key={a.id_alias}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold leading-snug text-pac-tinta">
                      {a.alias}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-pac-tinta-suave">
                      <span aria-hidden="true">→</span>
                      {a.id_categoria !== null ? (
                        <>
                          <Insignia>categoría</Insignia>
                          <span>{a.categorias?.nombre ?? `#${a.id_categoria}`}</span>
                        </>
                      ) : (
                        <>
                          <Insignia>producto</Insignia>
                          <span>
                            {a.productos
                              ? `${a.productos.nombre} · ${a.productos.marca} · ${a.productos.formato}`
                              : `#${a.id_producto}`}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <BotonEnlace
                      href={`/admin/aliases/${a.id_alias}/editar`}
                      tamano="sm"
                      variante="contorno"
                    >
                      Editar
                    </BotonEnlace>
                    <form action={eliminarAlias}>
                      <input type="hidden" name="id" value={a.id_alias} />
                      <Boton type="submit" tamano="sm" variante="peligro">
                        Eliminar
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

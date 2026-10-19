import { createClient } from "@/utils/supabase/server";
import { TIPOS_COMERCIO } from "@/lib/tipos_comercio";
import { actualizarComercio } from "../../acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel } from "@/components/ui/panel";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Casilla, Entrada, Selector } from "@/components/ui/campo";

export const metadata = { title: "Editar comercio" };

export default async function EditarComercioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: comercio }, { data: todos }] = await Promise.all([
    supabase
      .from("v_comercios_coordenadas")
      .select("*")
      .eq("id_comercio", Number(id))
      .maybeSingle(),
    supabase
      .from("comercios")
      .select("id_comercio, nombre, id_matriz, activo")
      .order("nombre"),
  ]);

  if (!comercio) {
    return (
      <Contenedor ancho="angosto">
        <div className="py-14">
          <EstadoVacio
            titulo="Comercio no encontrado"
            descripcion="El identificador de la URL no corresponde a ningún comercio registrado."
            accion={
              <BotonEnlace href="/admin/comercios" variante="contorno" tamano="sm">
                Volver a comercios
              </BotonEnlace>
            }
          />
        </div>
      </Contenedor>
    );
  }

  const lista = todos ?? [];
  const conSucursales = new Set(
    lista.filter((c) => c.id_matriz !== null).map((c) => c.id_matriz),
  );

  // Una matriz con sucursales no puede convertirse en sucursal (lo bloquea el
  // trigger), y un comercio no puede ser su propia matriz. La matriz actual
  // siempre queda disponible para no romper la edición.
  const candidatas = lista.filter(
    (c) =>
      c.id_comercio !== comercio.id_comercio &&
      c.id_matriz === null &&
      c.activo &&
      (c.id_comercio === comercio.id_matriz || !conSucursales.has(c.id_comercio)),
  );

  return (
    <Contenedor ancho="angosto">
      <EncabezadoPagina
        miga={[
          { etiqueta: "Inicio", href: "/" },
          { etiqueta: "Panel", href: "/admin" },
          { etiqueta: "Comercios", href: "/admin/comercios" },
          { etiqueta: "Editar" },
        ]}
        eyebrow={`Comercio #${comercio.id_comercio}`}
        titulo="Editar comercio"
        descripcion="Mover las coordenadas fuera del polígono comunal impide guardar."
      />

      <Panel acento="azul" className="my-8">
        <form action={actualizarComercio}>
          <input type="hidden" name="id" value={comercio.id_comercio ?? ""} />

          <div className="flex flex-col gap-4 p-5">
            <Campo etiqueta="Nombre" para="nombre" requerido>
              <Entrada
                id="nombre"
                name="nombre"
                required
                defaultValue={comercio.nombre ?? ""}
              />
            </Campo>

            <Campo etiqueta="Dirección" para="direccion" requerido>
              <Entrada
                id="direccion"
                name="direccion"
                required
                defaultValue={comercio.direccion ?? ""}
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Tipo" para="tipo" requerido>
                <Selector
                  id="tipo"
                  name="tipo"
                  required
                  defaultValue={comercio.tipo ?? ""}
                >
                  {TIPOS_COMERCIO.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.etiqueta}
                    </option>
                  ))}
                </Selector>
              </Campo>

              <Campo etiqueta="Sucursal de" para="id_matriz">
                <Selector
                  id="id_matriz"
                  name="id_matriz"
                  defaultValue={comercio.id_matriz ?? ""}
                >
                  <option value="">Es matriz o local independiente</option>
                  {candidatas.map((c) => (
                    <option key={c.id_comercio} value={c.id_comercio}>
                      {c.nombre}
                    </option>
                  ))}
                </Selector>
              </Campo>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Latitud" para="lat" requerido>
                <Entrada
                  id="lat"
                  name="lat"
                  type="number"
                  step="0.000001"
                  inputMode="decimal"
                  required
                  defaultValue={comercio.lat ?? ""}
                  className="cifra"
                />
              </Campo>
              <Campo etiqueta="Longitud" para="lng" requerido>
                <Entrada
                  id="lng"
                  name="lng"
                  type="number"
                  step="0.000001"
                  inputMode="decimal"
                  required
                  defaultValue={comercio.lng ?? ""}
                  className="cifra"
                />
              </Campo>
            </div>

            <Casilla
              etiqueta="Activo"
              name="activo"
              defaultChecked={comercio.activo ?? false}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-pac-linea bg-pac-fondo/50 px-5 py-3.5">
            <BotonEnlace href="/admin/comercios" variante="fantasma">
              Cancelar
            </BotonEnlace>
            <Boton type="submit">Guardar cambios</Boton>
          </div>
        </form>
      </Panel>
    </Contenedor>
  );
}

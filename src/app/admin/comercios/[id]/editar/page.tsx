import { createClient } from "@/utils/supabase/server";
import { actualizarComercio } from "../../acciones";
import { Contenedor, EncabezadoPagina, EstadoVacio } from "@/components/ui/pagina";
import { Panel } from "@/components/ui/panel";
import { BotonEnlace } from "@/components/ui/boton";
import { FormularioComercio } from "@/components/formulario_comercio";

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
        descripcion="Si cambias la dirección, el sistema vuelve a calcular la ubicación."
      />

      <Panel acento="azul" className="my-8">
        <FormularioComercio
          accion={actualizarComercio}
          matrices={candidatas}
          comercio={{
            id_comercio: Number(id),
            nombre: comercio.nombre ?? "",
            direccion: comercio.direccion ?? "",
            tipo: comercio.tipo ?? "",
            id_matriz: comercio.id_matriz ?? null,
            activo: comercio.activo ?? false,
            lat: comercio.lat ?? null,
            lng: comercio.lng ?? null,
          }}
          textoBoton="Guardar cambios"
        />
      </Panel>

      <div className="pb-14">
        <BotonEnlace href="/admin/comercios" variante="fantasma">
          Volver a comercios
        </BotonEnlace>
      </div>
    </Contenedor>
  );
}

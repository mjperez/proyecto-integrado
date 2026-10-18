"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { parseCsv, parsearPrecio } from "@/lib/csv";

const ROLES_INGESTA = ["comercio", "terreno", "administrador"];
// 900 KB y no 1 MB: el límite por defecto del cuerpo de una Server Action en
// Next es 1 MB, y el multipart pesa algo más que el archivo. Con 900 KB el
// rechazo lo da este código, con un mensaje claro, antes que el framework.
const TAMANO_MAXIMO = 900_000;
const FILAS_MAXIMAS = 500;
const COLUMNAS = ["nombre", "marca", "formato", "precio"];

export type ErrorFila = { linea: number; mensaje: string };

export type ResultadoCarga = {
  ok: boolean;
  insertadas: number;
  errores: ErrorFila[];
  mensaje: string | null;
};

function fallo(mensaje: string): ResultadoCarga {
  return { ok: false, insertadas: 0, errores: [], mensaje };
}

// Todas las filas se validan antes de escribir. Si una sola falla no se inserta
// nada: la planilla se corrige y se vuelve a subir completa, así no quedan
// cargas a medias ni precios duplicados por reintentos.
export async function cargarCsv(
  _estado: ResultadoCarga | null,
  formData: FormData,
): Promise<ResultadoCarga> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fallo("La sesión expiró. Vuelve a ingresar.");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("id_usuario, roles(nombre)")
    .eq("auth_uid", user.id)
    .maybeSingle();

  const rol = perfil?.roles?.nombre;
  if (!perfil || !rol || !ROLES_INGESTA.includes(rol)) {
    return fallo("Tu rol no permite cargar precios.");
  }

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return fallo("Selecciona un archivo CSV.");
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return fallo("El archivo supera 900 KB. Divide la planilla en partes.");
  }

  const idComercio = Number(formData.get("comercio"));
  if (!Number.isInteger(idComercio) || idComercio <= 0) {
    return fallo("Selecciona un comercio.");
  }

  // Un usuario con rol comercio solo puede cargar sobre sus propios locales.
  // La política RLS lo exige igual, pero el aviso temprano es más claro.
  if (rol === "comercio") {
    const { data: vinculo } = await supabase
      .from("usuarios_comercios")
      .select("id_comercio")
      .eq("id_usuario", perfil.id_usuario)
      .eq("id_comercio", idComercio)
      .maybeSingle();

    if (!vinculo) return fallo("Ese comercio no está asociado a tu usuario.");
  }

  const texto = await archivo.text();
  const filas = parseCsv(texto);

  if (filas.length === 0) return fallo("El archivo está vacío.");
  if (filas.length > FILAS_MAXIMAS + 1) {
    return fallo(`La planilla supera ${FILAS_MAXIMAS} filas. Divídela en partes.`);
  }

  const cabecera = filas[0].map((c) => c.trim().toLowerCase());
  const indices = COLUMNAS.map((c) => cabecera.indexOf(c));
  if (indices.some((i) => i === -1)) {
    return fallo(
      "La primera fila debe tener las columnas nombre, marca, formato y precio.",
    );
  }

  const { data: productos, error: errorCatalogo } = await supabase
    .from("productos")
    .select("id_producto, nombre, marca, formato, activo");

  if (errorCatalogo) return fallo(`No se pudo leer el catálogo: ${errorCatalogo.message}`);

  const clave = (nombre: string, marca: string, formato: string) =>
    `${nombre.trim().toLowerCase()}|${marca.trim().toLowerCase()}|${formato.trim().toLowerCase()}`;

  const catalogo = new Map(
    (productos ?? []).map((p) => [clave(p.nombre, p.marca, p.formato), p]),
  );

  const errores: ErrorFila[] = [];
  const insertables: {
    id_producto: number;
    id_comercio: number;
    valor: number;
  }[] = [];
  const vistos = new Map<number, number>();

  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i];
    const linea = i + 1;

    if (fila.every((c) => c.trim() === "")) continue;

    if (fila.length < COLUMNAS.length) {
      errores.push({ linea, mensaje: "faltan columnas en la fila" });
      continue;
    }

    const nombre = fila[indices[0]];
    const marca = fila[indices[1]];
    const formato = fila[indices[2]];
    const precioBruto = fila[indices[3]];

    const valor = parsearPrecio(precioBruto);
    if (valor === null) {
      errores.push({
        linea,
        mensaje: `precio inválido ("${precioBruto.trim()}"): usa 1290 o 1290,50, sin separador de miles`,
      });
      continue;
    }

    const producto = catalogo.get(clave(nombre, marca, formato));
    if (!producto) {
      errores.push({
        linea,
        mensaje: `el producto "${nombre.trim()}" (${marca.trim()}, ${formato.trim()}) no está en el catálogo`,
      });
      continue;
    }
    if (!producto.activo) {
      errores.push({ linea, mensaje: `el producto "${producto.nombre}" está inactivo` });
      continue;
    }

    const lineaPrevia = vistos.get(producto.id_producto);
    if (lineaPrevia !== undefined) {
      errores.push({
        linea,
        mensaje: `producto repetido: ya aparece en la línea ${lineaPrevia}`,
      });
      continue;
    }
    vistos.set(producto.id_producto, linea);

    insertables.push({
      id_producto: producto.id_producto,
      id_comercio: idComercio,
      valor,
    });
  }

  if (errores.length > 0) {
    return {
      ok: false,
      insertadas: 0,
      errores,
      mensaje: "No se cargó nada: corrige las filas indicadas y vuelve a subir la planilla.",
    };
  }

  if (insertables.length === 0) {
    return fallo("La planilla no tiene filas con datos.");
  }

  const { error: errorInsercion } = await supabase.from("precios").insert(insertables);

  if (errorInsercion) {
    return fallo(`No se pudo guardar: ${errorInsercion.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/ingesta/csv");

  return {
    ok: true,
    insertadas: insertables.length,
    errores: [],
    mensaje: `Se cargaron ${insertables.length} precios.`,
  };
}

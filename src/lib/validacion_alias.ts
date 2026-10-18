// Validación del mantenedor de aliases, separada de la Server Action para
// poder probarla sin Supabase ni Next.

// El CHECK `alias_un_solo_destino` exige exactamente un destino. El formulario
// manda un solo campo "destino" con el formato "categoria:<id>" o
// "producto:<id>", y acá se traduce a las dos columnas.
export type Destino = { tipo: "categoria" | "producto"; id: number };

export function leerDestino(valor: string): Destino | null {
  const partes = valor.split(":");
  if (partes.length !== 2) return null;

  const [tipo, idTexto] = partes;
  const id = Number(idTexto);

  if (!Number.isInteger(id) || id <= 0) return null;
  if (tipo !== "categoria" && tipo !== "producto") return null;

  return { tipo, id };
}

export function columnas(destino: Destino) {
  return destino.tipo === "categoria"
    ? { id_categoria: destino.id, id_producto: null }
    : { id_categoria: null, id_producto: destino.id };
}

// El alias es una clave de normalización: se guarda en minúsculas para que
// "Marraqueta" y "marraqueta" no terminen siendo dos filas distintas.
export function normalizarAlias(bruto: string): string {
  return bruto.trim().toLowerCase();
}

export const LARGO_MAXIMO_ALIAS = 100;

export function validarAlias(alias: string, destino: Destino | null): string | null {
  if (!alias || alias.length > LARGO_MAXIMO_ALIAS) return "alias";
  if (!destino) return "destino";
  return null;
}

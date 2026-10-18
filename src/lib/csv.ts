// Parser CSV mínimo, sin dependencias. Soporta campos entre comillas, comillas
// escapadas ("") y separador coma o punto y coma, que es lo que exporta Excel
// en configuración regional chilena.

function detectarSeparador(cabecera: string): string {
  const comas = (cabecera.match(/,/g) ?? []).length;
  const puntoYComa = (cabecera.match(/;/g) ?? []).length;
  return puntoYComa > comas ? ";" : ",";
}

export function parseCsv(texto: string): string[][] {
  const limpio = texto.replace(/^\uFEFF/, ""); // BOM de Excel
  const primeraLinea = limpio.split(/\r?\n/, 1)[0] ?? "";
  const separador = detectarSeparador(primeraLinea);

  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let entreComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];

    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      entreComillas = true;
    } else if (c === separador) {
      fila.push(campo);
      campo = "";
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else if (c !== "\r") {
      campo += c;
    }
  }

  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }

  return filas;
}

// Precio con coma o punto decimal y sin separador de miles. Se exige como
// máximo dos decimales para que "1.290" se rechace en vez de leerse como 1,29.
export function parsearPrecio(bruto: string): number | null {
  const limpio = bruto.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;

  const valor = Number(limpio);
  if (!Number.isFinite(valor) || valor <= 0) return null;

  return valor;
}

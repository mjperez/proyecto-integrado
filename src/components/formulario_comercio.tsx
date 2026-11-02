"use client";

import { useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { MapPin, Search } from "lucide-react";
import { TIPOS_COMERCIO } from "@/lib/tipos_comercio";
import type { Punto } from "@/lib/geocodificacion";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Casilla, Entrada, Selector } from "@/components/ui/campo";

// Leaflet toca `window` al importarse, así que el mapa solo puede existir en el
// navegador. Sin `ssr: false` el render del servidor revienta con
// "window is not defined".
const MapaPunto = dynamic(
  () => import("@/components/mapa_punto").then((m) => m.MapaPunto),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[260px] w-full items-center justify-center border border-pac-linea bg-pac-fondo">
        <span className="micro text-pac-tinta-suave">Cargando mapa…</span>
      </div>
    ),
  },
);

type ComercioEditable = {
  id_comercio: number;
  nombre: string;
  direccion: string;
  tipo: string;
  id_matriz: number | null;
  activo: boolean;
  lat: number | null;
  lng: number | null;
};

type Props = {
  accion: (formData: FormData) => Promise<void>;
  matrices: { id_comercio: number; nombre: string }[];
  comercio?: ComercioEditable;
  textoBoton: string;
};

/**
 * Formulario de alta y edición de comercios.
 *
 * La persona escribe la dirección y el sistema resuelve el punto: no hay campos
 * de latitud ni longitud. Si el geocodificador no encuentra la dirección, se
 * despliega un mapa para marcarlo a mano, de modo que un pasaje sin numeración
 * en OpenStreetMap no deje el comercio sin ubicación.
 */
export function FormularioComercio({ accion, matrices, comercio, textoBoton }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const puntoInicial =
    comercio?.lat != null && comercio?.lng != null
      ? { lat: comercio.lat, lng: comercio.lng }
      : null;

  const [punto, setPunto] = useState<Punto | null>(puntoInicial);
  const [direccionResuelta, setDireccionResuelta] = useState<string | null>(
    puntoInicial ? (comercio?.direccion ?? null) : null,
  );
  const [buscando, setBuscando] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const datos = new FormData(form);
    const direccion = String(datos.get("direccion") ?? "").trim();

    // Con un punto ya resuelto y la misma dirección, se guarda sin volver a
    // consultar el servicio.
    if (punto && direccion === direccionResuelta) {
      datos.set("lat", String(punto.lat));
      datos.set("lng", String(punto.lng));
      iniciar(async () => {
        await accion(datos);
      });
      return;
    }

    void buscar(datos, direccion);
  }

  async function buscar(datos: FormData, direccion: string) {
    setBuscando(true);
    setAviso(null);

    try {
      const respuesta = await fetch(
        `/api/geocodificar?direccion=${encodeURIComponent(direccion)}`,
      );

      if (respuesta.ok) {
        const resuelto = (await respuesta.json()) as Punto;
        setPunto(resuelto);
        setDireccionResuelta(direccion);
        setMarcando(false);
        setBuscando(false);
        datos.set("lat", String(resuelto.lat));
        datos.set("lng", String(resuelto.lng));
        iniciar(async () => {
          await accion(datos);
        });
        return;
      }

      setAviso(
        respuesta.status === 404
          ? "No encontramos esa dirección en el mapa. Marca el punto a mano."
          : "El servicio de mapas no respondió. Marca el punto a mano.",
      );
    } catch {
      setAviso("No se pudo consultar el mapa. Marca el punto a mano.");
    }

    setBuscando(false);
    setMarcando(true);
  }

  function marcar(nuevo: Punto) {
    setPunto(nuevo);
    const form = formRef.current;
    const direccion = form
      ? String(new FormData(form).get("direccion") ?? "").trim()
      : null;
    setDireccionResuelta(direccion);
  }

  const ocupado = buscando || pendiente;

  return (
    <form ref={formRef} onSubmit={enviar} className="flex flex-col gap-3.5 p-5">
      {comercio && <input type="hidden" name="id" value={comercio.id_comercio} />}

      <Campo etiqueta="Nombre" para="nombre" requerido>
        <Entrada
          id="nombre"
          name="nombre"
          required
          defaultValue={comercio?.nombre ?? ""}
          placeholder="Almacén Doña Rosa"
        />
      </Campo>

      <Campo
        etiqueta="Dirección"
        para="direccion"
        requerido
        ayuda="Calle y número. El sistema calcula la ubicación solo."
      >
        <Entrada
          id="direccion"
          name="direccion"
          required
          defaultValue={comercio?.direccion ?? ""}
          placeholder="Club Hípico 4216"
          onChange={() => {
            setPunto(null);
            setDireccionResuelta(null);
            setMarcando(false);
            setAviso(null);
          }}
        />
      </Campo>

      <Campo etiqueta="Tipo" para="tipo" requerido>
        <Selector id="tipo" name="tipo" required defaultValue={comercio?.tipo ?? ""}>
          <option value="" disabled>
            Selecciona un tipo
          </option>
          {TIPOS_COMERCIO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </Selector>
      </Campo>

      <Campo
        etiqueta="Sucursal de"
        para="id_matriz"
        ayuda="Deja vacío si es matriz o local independiente."
      >
        <Selector id="id_matriz" name="id_matriz" defaultValue={comercio?.id_matriz ?? ""}>
          <option value="">Es matriz o local independiente</option>
          {matrices.map((m) => (
            <option key={m.id_comercio} value={m.id_comercio}>
              {m.nombre}
            </option>
          ))}
        </Selector>
      </Campo>

      <Casilla
        etiqueta="Activo"
        name="activo"
        defaultChecked={comercio?.activo ?? true}
      />

      {aviso && <Aviso tono="alerta">{aviso}</Aviso>}

      {punto && !marcando && (
        <div className="flex items-center gap-2 border border-pac-linea bg-pac-fondo/60 px-3 py-2 text-[12px] text-pac-tinta">
          <MapPin className="size-3.5 shrink-0 text-pac-azul" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">
            Ubicación calculada: {punto.lat.toFixed(5)}, {punto.lng.toFixed(5)}
          </span>
          <button
            type="button"
            onClick={() => setMarcando(true)}
            className="shrink-0 font-bold text-pac-azul underline"
          >
            Ajustar
          </button>
        </div>
      )}

      {marcando && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] leading-snug text-pac-tinta-suave">
            Toca el mapa donde está el local. El punto queda donde lo dejes.
          </p>
          <MapaPunto punto={punto} onMarcar={marcar} />
        </div>
      )}

      <Boton type="submit" bloque className="mt-1" disabled={ocupado}>
        {buscando ? (
          <span className="inline-flex items-center gap-2">
            <Search className="size-3.5" aria-hidden="true" />
            Buscando la dirección…
          </span>
        ) : pendiente ? (
          "Guardando…"
        ) : (
          textoBoton
        )}
      </Boton>
    </form>
  );
}

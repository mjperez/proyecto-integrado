"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Punto } from "@/lib/geocodificacion";

/**
 * Mapa mínimo para marcar un punto a mano, cuando la geocodificación no
 * encuentra la dirección. Se usa `circleMarker` y no `marker` porque el icono
 * por defecto de Leaflet necesita archivos de imagen que Next no sirve desde el
 * paquete.
 */
export function MapaPunto({
  punto,
  onMarcar,
}: {
  punto: Punto | null;
  onMarcar: (punto: Punto) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcaRef = useRef<L.CircleMarker | null>(null);
  const onMarcarRef = useRef(onMarcar);

  // El manejador del clic se registra una sola vez al crear el mapa, así que la
  // referencia se mantiene al día en un efecto y no durante el render.
  useEffect(() => {
    onMarcarRef.current = onMarcar;
  }, [onMarcar]);

  useEffect(() => {
    if (!divRef.current || mapaRef.current) return;

    const mapa = L.map(divRef.current, {
      center: [-33.4938, -70.6761],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapa);

    mapa.on("click", (evento: L.LeafletMouseEvent) => {
      onMarcarRef.current({ lat: evento.latlng.lat, lng: evento.latlng.lng });
    });

    mapaRef.current = mapa;

    return () => {
      mapa.remove();
      mapaRef.current = null;
      marcaRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !punto) return;

    if (marcaRef.current) {
      marcaRef.current.setLatLng([punto.lat, punto.lng]);
    } else {
      marcaRef.current = L.circleMarker([punto.lat, punto.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: "#c32e26",
        fillOpacity: 1,
      }).addTo(mapa);
    }

    mapa.setView([punto.lat, punto.lng], Math.max(mapa.getZoom(), 16));
  }, [punto]);

  return (
    <div
      ref={divRef}
      className="h-[260px] w-full border border-pac-linea"
      aria-label="Mapa para marcar la ubicación del comercio"
      role="application"
    />
  );
}

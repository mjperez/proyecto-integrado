import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA (US-H1). Declara nombre, colores institucionales e icono
 * para que el navegador ofrezca instalar el observatorio en el teléfono.
 *
 * Falta el service worker, que es lo que habilita el modo sin conexión y el
 * aviso de instalación automático en Chrome. Sin él, el manifiesto por sí solo
 * no completa la historia: queda como base.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Observatorio Comunal de Precios de Pedro Aguirre Cerda",
    short_name: "Precios PAC",
    description:
      "Precios de alimentos y productos básicos en los comercios de Pedro Aguirre Cerda.",
    start_url: "/comparador",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#004283",
    lang: "es-CL",
    icons: [
      {
        src: "/escudo_pac.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

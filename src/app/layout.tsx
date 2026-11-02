import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Slab } from "next/font/google";
import { AuthProvider } from "@/components/auth_provider";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-slab",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Observatorio Comunal de Precios",
    template: "%s · Observatorio de Precios",
  },
  description:
    "Precios de alimentos y productos básicos en los comercios de Pedro Aguirre Cerda, registrados por la Municipalidad.",
  applicationName: "Observatorio de Precios",
};

export const viewport: Viewport = {
  themeColor: "#004283",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CL"
      className={`${roboto.variable} ${robotoSlab.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Primer elemento enfocable de la página. Permite saltar la barra de
            navegación con el teclado sin recorrerla entera en cada visita. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-[14px] focus:font-bold focus:text-pac-azul focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-pac-azul"
        >
          Saltar al contenido
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

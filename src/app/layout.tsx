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
    "Precios de alimentos y productos básicos en los comercios de Pedro Aguirre Cerda, relevados por la Municipalidad.",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

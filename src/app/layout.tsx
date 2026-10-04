import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth_provider";
import "./globals.css";

import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans",
});

// en el return:


export const metadata: Metadata = {
  title: "Observatorio de Precios - Municipalidad Pedro Aguirre Cerda",
  description: "Proyecto MAMAMA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}

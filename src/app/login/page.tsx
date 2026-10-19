import { Suspense } from "react";
import Formulario from "./formulario";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-pac-fondo">
      <div className="h-[3px] bg-pac-rojo" />

      {/* Franja institucional sin navegación: es una pantalla de acceso, no
          una página del sitio. */}
      <div className="bg-pac-azul">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-5 sm:px-8">
          <span className="grid size-8 shrink-0 place-items-center bg-white font-slab text-[11px] font-bold leading-none text-pac-azul">
            PAC
          </span>
          <div>
            <p className="text-[9px] font-medium uppercase leading-none tracking-[0.16em] text-white/55">
              Municipalidad de
            </p>
            <p className="mt-1 text-[13px] font-bold leading-none text-white">
              Pedro Aguirre Cerda
            </p>
          </div>
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[380px]">
          <div className="border border-pac-linea bg-white px-6 py-7">
            <Suspense
              fallback={
                <div className="flex flex-col gap-3" aria-busy="true">
                  <div className="h-3 w-24 bg-pac-fondo" />
                  <div className="h-10 w-full bg-pac-fondo" />
                  <div className="h-10 w-full bg-pac-fondo" />
                  <div className="h-11 w-full bg-pac-fondo" />
                </div>
              }
            >
              <Formulario />
            </Suspense>
          </div>

          <p className="mt-4 px-2 text-center text-[11px] leading-relaxed text-pac-tinta-suave">
            Acceso restringido a funcionarios municipales y comercios adheridos
            al Observatorio.
          </p>
        </div>
      </main>
    </div>
  );
}

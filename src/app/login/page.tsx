import { Suspense } from "react";
import Formulario from "./formulario";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(420px,46%)]">
      {/* Panel institucional: solo en pantallas anchas. */}
      <aside className="hidden flex-col justify-between bg-pac-azul p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center bg-white font-slab text-[13px] font-bold leading-none text-pac-azul">
            PAC
          </span>
          <div>
            <p className="text-[9px] font-medium uppercase leading-none tracking-[0.18em] text-white/55">
              Municipalidad de
            </p>
            <p className="mt-1 font-slab text-[15px] font-bold leading-none text-white">
              Pedro Aguirre Cerda
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="micro mb-4 text-white/50">Observatorio Comunal</p>
          <p className="font-slab text-[30px] font-bold leading-[1.15] text-white">
            Un precio publicado tiene que poder rastrearse hasta el local y la
            fecha en que se relevó.
          </p>
          <div className="mt-8 h-[3px] w-16 bg-pac-rojo" />
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-white/20 pt-6">
          {[
            ["Roles", "5 perfiles con permisos distintos"],
            ["Registro", "Auditoría encadenada por hash"],
            ["Ingesta", "Formulario y planilla semanal"],
            ["Cobertura", "Comercios de toda la comuna"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="micro mb-1.5 text-white/45">{k}</dt>
              <dd className="text-[13px] leading-snug text-white/80">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <section className="flex flex-col justify-center px-6 py-14 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
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
      </section>
    </main>
  );
}

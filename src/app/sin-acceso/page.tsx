import { BotonEnlace } from "@/components/ui/boton";
import { BarraSuperior } from "@/components/shell/barra_superior";
import { Etiqueta } from "@/components/ui/etiqueta";

export const metadata = { title: "Sin acceso" };

export default function SinAccesoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <BarraSuperior />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Etiqueta className="mb-3 block">Acceso restringido</Etiqueta>
          <h1 className="text-[30px] font-bold leading-tight text-pac-azul">
            Tu perfil no tiene permiso para esta sección
          </h1>
          <div className="mt-5 h-[3px] w-14 bg-pac-rojo" />
          <p className="mt-5 text-[14px] leading-relaxed text-pac-tinta-suave">
            La cuenta está activa, pero el rol asignado no habilita este módulo.
            Si crees que es un error, contacta al administrador del Observatorio
            en la Dirección de Desarrollo Comunitario.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <BotonEnlace href="/dashboard" variante="institucional">
              Ir a mi panel
            </BotonEnlace>
            <BotonEnlace href="/" variante="contorno">
              Portada
            </BotonEnlace>
          </div>
        </div>
      </main>
    </div>
  );
}

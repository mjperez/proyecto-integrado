import { BotonEnlace } from "@/components/ui/boton";
import { BarraSuperior } from "@/components/shell/barra_superior";

export const metadata = { title: "Sin acceso" };

export default function SinAccesoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <BarraSuperior />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-5 h-[3px] w-14 bg-pac-rojo" />
          <h1 className="text-[28px] leading-tight text-pac-azul">
            Tu perfil no tiene permiso para esta sección
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-pac-tinta-suave">
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

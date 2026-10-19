import { requerirRol } from "@/lib/auth";
import { BarraSuperior } from "@/components/shell/barra_superior";
import { NavModulos } from "@/components/shell/nav_modulos";
import { Pie } from "@/components/shell/pie";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requerirRol("administrador");

  return (
    <div className="flex min-h-screen flex-col">
      <BarraSuperior fija />
      <NavModulos />
      <main className="flex-1 bg-pac-fondo/40">{children}</main>
      <Pie />
    </div>
  );
}

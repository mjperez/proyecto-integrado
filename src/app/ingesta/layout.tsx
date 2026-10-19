import { BarraSuperior } from "@/components/shell/barra_superior";
import { Pie } from "@/components/shell/pie";

export default function IngestaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <BarraSuperior fija />
      <main className="flex-1">{children}</main>
      <Pie />
    </div>
  );
}

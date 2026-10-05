import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-pac-gris p-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-pac-azul">
          Observatorio Comunal de Precios
        </h1>
        <p className="mt-2 text-muted-foreground">
          Municipalidad de Pedro Aguirre Cerda - DIDESE
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded bg-primary px-6 py-2 font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
        >
          Ingresar
        </Link>
        <Link
          href="/mapa"
          className="rounded border border-primary px-6 py-2 font-medium text-primary transition-colors hover:bg-accent"
        >
          Mapa
        </Link>
        <Link
          href="/comparador"
          className="rounded border border-primary px-6 py-2 font-medium text-primary transition-colors hover:bg-accent"
        >
          Comparador
        </Link>
      </div>
    </main>
  );
}
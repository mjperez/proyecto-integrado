import Link from "next/link";

export default function SinAccesoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-pac-gris p-6 text-center">
      <h1 className="text-2xl font-bold text-pac-azul">Sin acceso</h1>
      <p className="max-w-md text-muted-foreground">
        Tu cuenta está activa, pero el rol asignado no tiene permiso para esta
        sección. Si crees que es un error, contacta al administrador de DIDESE.
      </p>
      <Link
        href="/"
        className="rounded bg-primary px-6 py-2 font-semibold text-primary-foreground"
      >
        Volver al inicio
      </Link>
    </main>
  );
}

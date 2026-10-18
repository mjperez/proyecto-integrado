import { Suspense } from "react";
import Formulario from "./formulario";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Cargando…
        </main>
      }
    >
      <Formulario />
    </Suspense>
  );
}

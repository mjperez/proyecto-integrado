"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth_provider";

export default function LoginPage() {
  const { sesion, perfil, cargando, salir } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function ingresar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Correo o contraseña incorrectos.");
    }
    setEnviando(false);
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando sesión…
      </main>
    );
  }

  if (sesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pac-gris p-6">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-pac-azul">Sesión iniciada</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sesion.user.email}</p>
          {perfil ? (
            <p className="mt-1 text-sm">
              Rol: <span className="font-medium">{perfil.rol?.nombre}</span>
            </p>
          ) : (
            <p className="mt-3 rounded-md bg-pac-naranjo/10 p-3 text-sm text-pac-naranjo">
              Tu cuenta existe en Supabase Auth, pero no tiene fila en la tabla
              usuario, así que no tiene rol asignado.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/mapa"
              className="rounded bg-primary py-2 text-center font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro"
            >
              Ir al mapa
            </Link>
            <button
              onClick={() => salir()}
              className="rounded border border-pac-rojo py-2 text-sm font-medium text-pac-rojo transition-colors hover:bg-pac-rojo/10"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-pac-gris p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-pac-azul">Iniciar Sesión</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Observatorio Comunal de Precios
        </p>

        <form onSubmit={ingresar} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-input p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {error && <p className="text-sm text-pac-rojo">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="rounded bg-primary py-2 font-semibold text-primary-foreground transition-colors hover:bg-pac-azul-oscuro disabled:opacity-50"
          >
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
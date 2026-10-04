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

  async function ingresar(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Mensaje genérico a propósito: no revelamos si el correo existe o no
      setError("Correo o contraseña incorrectos.");
    }
    setEnviando(false);
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Cargando sesión…
      </main>
    );
  }

  // ¿Ya hay sesión? Mostrar la tarjeta con el rol en vez del formulario
  if (sesion) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Sesión iniciada</h1>
          <p className="mt-2 text-sm text-gray-600">{sesion.user.email}</p>
          {perfil ? (
            <p className="mt-1 text-sm">
              Rol: <span className="font-medium">{perfil.rol?.nombre}</span>
            </p>
          ) : (
            <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              Tu cuenta existe en Supabase Auth, pero no tiene fila en la tabla
              usuario, así que no tiene rol asignado.
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Link href="/" className="rounded-md border px-3 py-2 text-sm">
              Volver
            </Link>
            <button
              onClick={() => salir()}
              className="rounded-md bg-red-600 px-3 py-2 text-sm text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={ingresar} className="w-full max-w-sm rounded-xl border p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-gray-600">Observatorio de Precios — PAC</p>

        <label className="mt-4 block text-sm">Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />

        <label className="mt-3 block text-sm">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-4 w-full rounded-md bg-[#004283] px-3 py-2 text-white disabled:opacity-50"
        >
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
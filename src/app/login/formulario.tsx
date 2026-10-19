"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth_provider";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Etiqueta, Insignia } from "@/components/ui/etiqueta";

// Cliente de navegador con la sesión en cookies, para que el proxy y los
// Server Components puedan verla.
const supabase = createClient();

// Evita redirecciones abiertas: solo se aceptan rutas internas relativas.
function destinoSegura(next: string | null): string {
  if (!next) return "/mapa";
  if (!next.startsWith("/")) return "/mapa";
  if (next.startsWith("//")) return "/mapa";
  if (next.startsWith("/login") || next.startsWith("/auth")) return "/mapa";
  return next;
}

export default function Formulario() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = destinoSegura(params.get("next"));

  const { sesion, perfil, cargando, salir } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesión y venimos de una redirección con ?next, enviamos al destino.
  useEffect(() => {
    if (sesion && destino !== "/mapa") {
      router.replace(destino);
    }
  }, [sesion, destino, router]);

  async function ingresar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setEnviando(false);
      return;
    }
    router.push(destino);
    router.refresh();
  }

  if (cargando) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="h-3 w-24 bg-pac-fondo" />
        <div className="h-10 w-full bg-pac-fondo" />
        <div className="h-10 w-full bg-pac-fondo" />
        <div className="h-11 w-full bg-pac-fondo" />
      </div>
    );
  }

  if (sesion) {
    return (
      <div>
        <Etiqueta className="mb-3 block">Sesión iniciada</Etiqueta>
        <h1 className="text-[26px] font-bold leading-tight text-pac-azul">
          Ya tienes una sesión abierta
        </h1>
        <p className="mt-2 text-[14px] text-pac-tinta-suave">
          {sesion.user.email}
        </p>

        <div className="mt-5">
          <Insignia tono={perfil ? "neutro" : "destacado"}>
            {perfil?.roles?.nombre ?? "Sin rol asignado"}
          </Insignia>
        </div>

        {!perfil && (
          <Aviso tono="alerta" className="mt-5" titulo="Cuenta sin perfil">
            La cuenta existe en el sistema de acceso, pero no tiene fila en la
            tabla de usuarios, así que no tiene rol asignado. Pide al
            administrador que la vincule.
          </Aviso>
        )}

        <div className="mt-7 flex flex-col gap-2">
          <Link
            href="/mapa"
            className="inline-flex h-11 w-full items-center justify-center border border-pac-azul bg-pac-azul text-[12px] font-bold uppercase tracking-[0.09em] text-white transition-colors hover:bg-pac-azul-profundo"
          >
            Ir al mapa
          </Link>
          <Boton variante="peligro" bloque onClick={() => salir()}>
            Cerrar sesión
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] leading-tight text-pac-azul">Iniciar sesión</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-pac-tinta-suave">
        Usa las credenciales entregadas por la Dirección de Desarrollo
        Comunitario.
      </p>

      <form onSubmit={ingresar} className="mt-6 flex flex-col gap-4">
        <Campo etiqueta="Correo electrónico" para="email" requerido>
          <Entrada
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Campo>

        <Campo etiqueta="Contraseña" para="password" requerido>
          <Entrada
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Campo>

        {error && <Aviso tono="error">{error}</Aviso>}

        <Boton
          type="submit"
          disabled={enviando}
          tamano="lg"
          bloque
          className="mt-1"
        >
          {enviando ? "Ingresando…" : "Ingresar"}
        </Boton>
      </form>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 text-[12px] font-medium text-pac-tinta-suave transition-colors hover:text-pac-azul"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Volver a la portada
      </Link>
    </div>
  );
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

// Cliente de navegador con la sesión en cookies, para que el proxy y los
// Server Components puedan verla.
const supabase = createClient();

type Perfil = {
  id_rol: number;
  roles: { nombre: string } | null;
};

type AuthContexto = {
  sesion: Session | null;
  perfil: Perfil | null;
  cargando: boolean;
  salir: () => Promise<void>;
};

const ContextoAuth = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [sesionLista, setSesionLista] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  // A qué usuario pertenece el perfil cargado. Evita mostrar el rol de la
  // sesión anterior mientras se resuelve la nueva.
  const [perfilDe, setPerfilDe] = useState<string | null>(null);

  // Al abrir la app: recuperar la sesión guardada y escuchar cambios.
  // Todos los setState van dentro de callbacks, nunca en el cuerpo del efecto.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setSesionLista(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const idUsuario = sesion?.user.id ?? null;

  // Cuando cambia la sesión, busca el rol en la tabla de usuarios.
  useEffect(() => {
    if (!idUsuario) return;

    let cancelado = false;

    supabase
      .from("usuarios")
      .select("id_rol, roles(nombre)")
      .eq("auth_uid", idUsuario)
      .single()
      .then(({ data }) => {
        if (cancelado) return;
        setPerfil(data);
        setPerfilDe(idUsuario);
      });

    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  // Derivados: sin sesión no hay perfil, y "cargando" se calcula en lugar de
  // sincronizarse con setState.
  const perfilActual = idUsuario !== null && perfilDe === idUsuario ? perfil : null;
  const cargando = !sesionLista || (idUsuario !== null && perfilDe !== idUsuario);

  async function salir() {
    await supabase.auth.signOut();
  }

  return (
    <ContextoAuth.Provider
      value={{ sesion, perfil: perfilActual, cargando, salir }}
    >
      {children}
    </ContextoAuth.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(ContextoAuth);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

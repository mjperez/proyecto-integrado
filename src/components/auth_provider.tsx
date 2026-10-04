"use client";

import { createContext, useContext, useEffect, useState} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Perfil = {
    id_rol: number;
    rol: { nombre: string } | null;
};

type AuthContexto = {
    sesion : Session | null;
    perfil : Perfil | null;
    cargando: boolean;
    salir: () => Promise<void>;
};

const ContextoAuth = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode}) {
    const [sesion, setSesion] = useState<Session | null>(null);
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [cargando, setCargando] = useState(true);


// Al abrir la app: Recuperar sesión guardada y escuchar cambios (login/logout)
useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));

    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
        setSesion(nuevaSesion);
    });
    return () => data.subscription.unsubscribe();
}, []);

// Cuando la sesión cambia: busca el rol en la tabla de usuario
useEffect(() => {
    if (!sesion){
        setPerfil(null);
        setCargando(false);
        return;
    }
    supabase
        .from("usuario")
        .select("id_rol, rol(nombre)")
        .eq("auth_uid", sesion.user.id)
        .single()
        .then(({ data }) => {
            setPerfil(data);
            setCargando(false);
        });
}, [sesion]);

async function salir() {
    await supabase.auth.signOut();
}

return (
    <ContextoAuth.Provider value = {{sesion, perfil, cargando, salir}}>
        {children}
    </ContextoAuth.Provider>
);
}

export function useAuth(){
    const ctx = useContext(ContextoAuth);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    return ctx;
}


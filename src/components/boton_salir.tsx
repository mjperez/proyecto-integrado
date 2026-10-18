"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth_provider";

export default function BotonSalir() {
  const { salir } = useAuth();
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await salir();
        router.push("/");
        router.refresh();
      }}
      className="rounded border border-pac-rojo px-3 py-1 text-sm font-medium text-pac-rojo transition-colors hover:bg-pac-rojo/10"
    >
      Cerrar sesión
    </button>
  );
}

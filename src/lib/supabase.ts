// Cliente anónimo, SIN sesión. Guarda el token en memoria/localStorage, no en
// cookies, así que el proxy y los Server Components no lo ven.
//
// No lo uses en componentes de cliente: para eso está `@/utils/supabase/client`
// (createBrowserClient), que sí escribe cookies. Este archivo queda para
// scripts y pruebas fuera del ciclo de request.

import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

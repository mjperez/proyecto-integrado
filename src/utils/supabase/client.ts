import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/database.types' // Asegúrate de apuntar bien a tu ruta

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
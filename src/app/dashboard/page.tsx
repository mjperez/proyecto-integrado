import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient() // Instancia asíncrona

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-pac-gris p-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-pac-celeste">
          Panel de administración
        </p>
        <h1 className="mt-2 text-3xl font-bold text-pac-azul">
          Bienvenido {user.email}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestiona la información del Observatorio Comunal de Precios.
        </p>
      </div>
    </main>
  )
}
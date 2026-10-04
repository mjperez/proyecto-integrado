//import { createClient } from '@/utils/supabase/server'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  //const supabase = await createClient()

  // Revisamos si el usuario tiene sesión activa antes de cerrarla
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // Redirigimos al login tras borrar las cookies
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })
}

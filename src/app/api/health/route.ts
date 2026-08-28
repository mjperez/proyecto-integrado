import { NextResponse } from 'next/server';
import { initializeDB } from '@/lib/db';

// Fuerza a Next.js a no cachear este endpoint
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await initializeDB();
    
    return NextResponse.json({ 
      status: 'OK', 
      message: 'Conexión a PostgreSQL (Supabase) establecida exitosamente.',
      isInitialized: db.isInitialized
    });
  } catch (error) {
    console.error("Fallo crítico de conexión:", error);
    return NextResponse.json(
      { 
        status: 'ERROR', 
        message: 'Fallo al conectar con la base de datos',
        error: String(error)
      }, 
      { status: 500 }
    );
  }
}
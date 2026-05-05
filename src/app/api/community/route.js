// src/app/api/community/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

// Forzamos a que esta ruta sea dinámica para que Next.js no la guarde en caché y siempre muestre datos frescos
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('album_mundial');
    
    // Traemos todos los documentos, excluyendo el _id interno de Mongo para evitar errores de formato
    const users = await db.collection('Inventory').find({}, { projection: { _id: 0 } }).toArray();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error cargando la comunidad:", error);
    return NextResponse.json({ error: 'Error cargando la comunidad' }, { status: 500 });
  }
}
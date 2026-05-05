// src/app/api/album/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET(request: Request) {
  // Leemos el usuario desde la URL (ej: /api/album?user=juan-gmail-com)
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user'); 

  if (!userId) {
    return NextResponse.json({ error: 'Usuario no especificado' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('album_mundial');
    const album = await db.collection('Inventory').findOne({ userId });

    if (!album) {
      return NextResponse.json({ userId, missing: [], forTrade: {} });
    }
    return NextResponse.json(album);
  } catch (error) {
    return NextResponse.json({ error: 'Error cargando el álbum' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Recibimos el userId en el cuerpo de la petición
    const { userId, code, status, count } = await request.json();
    
    if (!userId) {
       return NextResponse.json({ error: 'Falta el usuario' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('album_mundial');

    const updateQuery: any = { $pull: {}, $unset: {}, $addToSet: {}, $set: {} };

    if (status === 'missing') {
      updateQuery.$addToSet.missing = code; 
      updateQuery.$unset[`forTrade.${code}`] = ""; 
    } else if (status === 'owned') {
      updateQuery.$pull.missing = code; 
      updateQuery.$unset[`forTrade.${code}`] = ""; 
    } else if (status === 'forTrade') {
      updateQuery.$pull.missing = code; 
      updateQuery.$set[`forTrade.${code}`] = count; 
    }

    Object.keys(updateQuery).forEach(key => {
      if (Object.keys(updateQuery[key]).length === 0) delete updateQuery[key];
    });

    await db.collection('Inventory').updateOne(
      { userId },
      updateQuery,
      { upsert: true } // Si el usuario no existe, lo crea
    );

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    return NextResponse.json({ error: 'Error guardando' }, { status: 500 });
  }
}
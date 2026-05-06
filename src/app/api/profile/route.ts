// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function POST(request: Request) {
  try {
    const { userId, phone } = await request.json();
    const client = await clientPromise;
    const db = client.db('album_mundial');

    // Actualizamos el documento del usuario agregando el campo 'phone'
    await db.collection('Inventory').updateOne(
      { userId },
      { $set: { phone } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error guardando el teléfono:", error);
    return NextResponse.json({ error: 'Error guardando perfil' }, { status: 500 });
  }
}
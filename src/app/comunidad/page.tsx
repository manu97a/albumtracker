// src/app/comunidad/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Comunidad() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community')
      .then(res => res.json())
      .then(data => {
        // Filtramos para no mostrar usuarios que tienen el álbum completamente en blanco (opcional pero recomendado)
        const activeUsers = data.filter((u: any) => u.missing?.length > 0 || Object.keys(u.forTrade || {}).length > 0);
        setUsers(activeUsers);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error al obtener la comunidad:", err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-xl text-gray-500">Buscando coleccionistas...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Comunidad de Intercambio</h1>
          <p className="text-slate-500">Explora los álbumes de otros coleccionistas y encuentra los cromos que te faltan.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const missingCount = user.missing?.length || 0;
            const tradeCount = Object.keys(user.forTrade || {}).length;

            return (
              <div key={user.userId} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 text-blue-700 font-bold text-xl w-12 h-12 flex items-center justify-center rounded-full uppercase">
                    {user.userId.substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{user.userId}</h2>
                    <p className="text-xs text-slate-400">Coleccionista activo</p>
                  </div>
                </div>

                <div className="flex justify-between bg-slate-50 p-4 rounded-xl mb-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">Busca</p>
                    <p className="text-2xl font-bold text-orange-500">{missingCount}</p>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">Ofrece</p>
                    <p className="text-2xl font-bold text-green-500">{tradeCount}</p>
                  </div>
                </div>

                {/* Usamos el componente Link de Next.js para una navegación rapidísima */}
                <Link 
                  href={`/${user.userId}`} 
                  className="mt-auto w-full block text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  Ver su álbum
                </Link>
              </div>
            );
          })}
          
          {users.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-12">
              Aún no hay coleccionistas activos en la plataforma.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
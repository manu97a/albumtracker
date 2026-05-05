// src/app/page.tsx
'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // 1. Extraemos todo lo que está antes del @
      const baseAlias = session.user.email.split('@')[0];
      
      // 2. Limpiamos por seguridad (solo minúsculas, números y guiones bajos)
      const cleanAlias = baseAlias.toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      // 3. Redirigimos a la URL limpia
      router.push(`/${cleanAlias}`);
    }
  }, [status, session, router]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Álbum Tracker</h1>
        <p className="text-gray-500 mb-8">Inicia sesión de forma segura para gestionar tus cromos.</p>
        
        {status === 'loading' ? (
          <p className="text-gray-500 font-medium animate-pulse">Cargando...</p>
        ) : (
          <button 
            onClick={() => signIn('google')}
            className="flex items-center justify-center w-full gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors text-lg shadow-sm"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        )}
      </div>
    </main>
  );
}
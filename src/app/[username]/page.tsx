// src/app/[username]/page.tsx
'use client'; 
import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { TEAMS } from '../../lib/constants'; 
import TeamGrid from '../../components/TeamGrid';
import Link from 'next/link';

export default function Dashboard({ params }: { params: Promise<{ username: string }> }) {
  const { data: session } = useSession();
  const [albumData, setAlbumData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false); 

  const resolvedParams = use(params);
  const currentUsername = resolvedParams.username;

  useEffect(() => {
    // 1. SEGURIDAD REAL: Verificamos si el correo de Google coincide con la URL
    let isThisUserOwner = false;
    if (session?.user?.email) {
      const userAlias = session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      isThisUserOwner = (userAlias === currentUsername);
    }
    setIsOwner(isThisUserOwner);

    // 2. Cargamos los datos del álbum
    fetch(`/api/album?user=${currentUsername}`)
      .then(res => res.json())
      .then(data => {
        setAlbumData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error cargando el álbum:", err);
        setIsLoading(false);
      });
  }, [currentUsername, session]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${currentUsername}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-xl text-gray-500">Cargando álbum...</div>;
  }

  // Extraemos tu alias para mandarlo a la vista pública y poder hacer el "Match"
  const viewerAlias = session?.user?.email 
    ? session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') 
    : null;

  // Si no es el dueño, mostramos la vista pública y le enviamos quién está mirando
  if (!isOwner) {
    return <PublicView username={currentUsername} data={albumData} viewerAlias={viewerAlias} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center flex flex-col items-center">
          {/* Título limpio y elegante */}
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
            Álbum de {currentUsername}
          </h1>
          
          <div onClick={handleCopyLink} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full cursor-pointer hover:bg-slate-50 shadow-sm transition-all text-sm">
            <span className="text-slate-500">Enlace público:</span>
            <span className="font-mono text-indigo-600 font-medium">{typeof window !== 'undefined' ? window.location.host : 'tusitio.com'}/{currentUsername}</span>
            <span className={`ml-2 text-xs font-bold px-2 py-1 rounded ${isCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {isCopied ? '¡Copiado!' : 'Copiar'}
            </span>
          </div>

          {/* Botón de comunidad más armónico */}
          <div className="mt-6">
             <Link 
               href="/comunidad" 
               className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-6 rounded-full transition-colors shadow-sm"
             >
               🌍 Ver álbumes de la comunidad 
             </Link>
          </div>
        </header>

        {TEAMS.map((team) => (
          <TeamGrid 
            key={team.code} 
            team={team} 
            missing={albumData?.missing || []} 
            forTrade={albumData?.forTrade || {}}
            currentUser={currentUsername} 
          />
        ))}
      </div>
    </main>
  );
}

// ==========================================
// COMPONENTE: LA VISTA PARA TUS AMIGOS
// ==========================================
function PublicView({ username, data, viewerAlias }: { username: string, data: any, viewerAlias: string | null }) {
  const [viewerData, setViewerData] = useState<any>(null);

  // Cuando cargue la vista, si estás logueado, traemos TU álbum por detrás
  useEffect(() => {
    if (viewerAlias) {
      fetch(`/api/album?user=${viewerAlias}`)
        .then(res => res.json())
        .then(resData => setViewerData(resData))
        .catch(err => console.error("Error cargando tus datos:", err));
    }
  }, [viewerAlias]);

  const missingCount = data?.missing?.length || 0;
  const forTradeList = Object.entries(data?.forTrade || {});
  
  // LOGICA DE MATCH: Filtramos los cromos que él tiene repetidos, revisando si están en tu lista de faltantes
  const perfectMatches = viewerData && viewerData.missing
    ? forTradeList.filter(([code]) => viewerData.missing.includes(code))
    : [];

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Álbum de {username}</h1>
          <p className="text-slate-500 mb-6">Revisa lo que le falta y lo que tiene repetido para intercambiar.</p>
          
          <a 
            href={`https://wa.me/?text=Hola!+Vi+tu+álbum+del+mundial+y+quiero+intercambiar+cromos!`}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm"
          >
            Hacerle una oferta
          </a>
        </div>

        {/* --- NUEVA SECCIÓN DE MATCH --- */}
        {viewerAlias && perfectMatches.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-indigo-800 mb-2 flex items-center justify-center gap-2">
              ¡Intercambia con <strong>{username}</strong>!
            </h2>
            <p className="text-indigo-600 mb-4">
               tiene <strong>{perfectMatches.length}</strong> cromos repetidos que a ti te faltan:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {perfectMatches.map(([code]) => (
                <span key={code} className="bg-white border border-indigo-300 text-indigo-700 px-3 py-1 rounded-lg font-bold text-sm shadow-sm">
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Columnas originales */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Columna: Lo que ofrezco */}
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <span className="bg-emerald-200 text-emerald-800 rounded-full w-8 h-8 flex items-center justify-center">🔁</span>
              Tiene para cambiar
            </h2>
            {forTradeList.length === 0 ? (
              <p className="text-emerald-600 italic">Aún no tiene repetidos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {forTradeList.map(([code, count]) => (
                  <span key={code} className="bg-white border border-emerald-300 text-emerald-700 px-3 py-1 rounded-lg font-bold text-sm shadow-sm">
                    {code} <span className="bg-emerald-500 text-white rounded-full px-2 py-0.5 ml-1 text-xs">{String(count)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Columna: Lo que busco */}
          <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
            <h2 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
              <span className="bg-orange-200 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center">🔍</span>
              Le faltan ({missingCount})
            </h2>
            {missingCount === 0 ? (
              <p className="text-orange-600 italic">¡Álbum completo!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data?.missing?.map((code: string) => (
                  <span key={code} className="bg-white border border-orange-200 text-orange-600 px-3 py-1 rounded-lg font-mono text-sm shadow-sm">
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
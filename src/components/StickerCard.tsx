'use client';
import { useState, useRef} from 'react';

type StickerStatus = 'missing' | 'owned' | 'forTrade';

interface StickerProps {
  code: string; 
  initialStatus?: StickerStatus;
  initialTradeCount?: number;
  currentUser: string; // <-- Recibimos el usuario
}

export default function StickerCard({ 
  code, 
  initialStatus = 'owned', 
  initialTradeCount = 0,
  currentUser 
}: StickerProps) {
  const [status, setStatus] = useState<StickerStatus>(initialStatus);
  const [tradeCount, setTradeCount] = useState(initialTradeCount);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      handleReset(e as any); // Marcamos como faltante al mantener presionado
      
      // Vibración sutil si el navegador lo soporta
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms = medio segundo
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleTouchMove = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const customHandleTap = (e: any) => {
    if (isLongPress.current) return; // Si fue un toque largo, ignoramos el tap normal
    handleTap(e);
  };
  // Enviamos el userId real a la base de datos
  const saveToDB = async (newStatus: StickerStatus, newCount: number) => {
    try {
      await fetch('/api/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser, // <-- Lo mandamos aquí
          code, 
          status: newStatus, 
          count: newCount 
        })
      });
    } catch (err) {
      console.error("Error guardando:", err);
    }
  };

  const handleTap = () => {
    let newStatus = status;
    let newCount = tradeCount;

    if (status === 'missing') {
      newStatus = 'owned';
    } else if (status === 'owned') {
      newStatus = 'forTrade';
      newCount = 1;
    } else if (status === 'forTrade') {
      newCount = tradeCount + 1;
    }

    // Actualizamos la pantalla instantáneamente
    setStatus(newStatus);
    setTradeCount(newCount);
    
    // Enviamos a la DB usando los nuevos valores
    saveToDB(newStatus, newCount);
  };

  const handleReset = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    
    const newStatus = 'missing';
    const newCount = 0;
    
    // Actualizamos pantalla
    setStatus(newStatus);
    setTradeCount(newCount);
    
    // Enviamos a la DB
    saveToDB(newStatus, newCount);
  };

  // ... (la parte superior del archivo con las funciones saveToDB y handleTap queda igual)

  // NUEVOS ESTILOS BASADOS EN LA PORTADA
  // Estilos más limpios y armónicos
  const baseStyle = "h-16 flex flex-col items-center justify-center font-bold text-sm cursor-pointer transition-all select-none rounded-lg border-2";
  
  const statusStyles = {
    missing: "bg-slate-50 text-slate-400 border-dashed border-slate-200",
    owned: "bg-white text-slate-700 border-solid border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    // Verde pastel con borde más definido
    forTrade: "bg-emerald-50 text-emerald-700 border-solid border-emerald-400 relative"
  };

  return (
    <div 
      onClick={customHandleTap} 
      onContextMenu={handleReset}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      className={`${baseStyle} ${statusStyles[status]}`}
      style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
    >
      <span>{code}</span>
      {status === 'forTrade' && tradeCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white border-2 border-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] shadow-sm font-bold z-10">
          +{tradeCount}
        </div>
      )}
    </div>
  );
}
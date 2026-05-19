'use client';
import { useState, useRef } from 'react';

type StickerStatus = 'missing' | 'owned' | 'forTrade';

interface StickerProps {
  code: string; 
  initialStatus?: StickerStatus;
  initialTradeCount?: number;
  currentUser: string; 
  onStatusChange?: (code: string, status: StickerStatus, count: number) => void;
}

export default function StickerCard({ 
  code, 
  initialStatus = 'owned', 
  initialTradeCount = 0,
  currentUser,
  onStatusChange
}: StickerProps) {
  const [status, setStatus] = useState<StickerStatus>(initialStatus);
  const [tradeCount, setTradeCount] = useState(initialTradeCount);
  
  // Refs para el móvil
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Enviamos el userId real a la base de datos
  const saveToDB = async (newStatus: StickerStatus, newCount: number) => {
    onStatusChange?.(code, newStatus, newCount);

    try {
      await fetch('/api/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser,
          code, 
          status: newStatus, 
          count: newCount 
        })
      });
    } catch (err) {
      console.error("Error guardando:", err);
    }
  };

  // 1. FUNCIÓN LIMPIA: Solo cambia estados y guarda (no depende de eventos)
  const executeReset = () => {
    const newStatus = 'missing';
    const newCount = 0;
    setStatus(newStatus);
    setTradeCount(newCount);
    saveToDB(newStatus, newCount);
  };

  // 2. LÓGICA TÁCTIL (Móvil)
  const handleTouchStart = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      executeReset(); // Llamamos a la función limpia aquí
      
      // Vibración sutil
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); 
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleTouchMove = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // 3. LÓGICA DE CLIC IZQUIERDO (PC) O TOQUE RÁPIDO (Móvil)
  const customHandleTap = () => {
    if (isLongPress.current) return; // Ignoramos si fue un toque largo
    
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

    setStatus(newStatus);
    setTradeCount(newCount);
    saveToDB(newStatus, newCount);
  };

  // 4. LÓGICA DE CLIC DERECHO (PC)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Solo prevenimos el menú de opciones nativo en PC
    executeReset();
  };

  // ESTILOS
  const baseStyle = "h-16 flex flex-col items-center justify-center font-bold text-sm cursor-pointer transition-all select-none rounded-lg border-2";
  
  const statusStyles = {
    missing: "bg-slate-50 text-slate-400 border-dashed border-slate-200",
    owned: "bg-white text-slate-700 border-solid border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    forTrade: "bg-emerald-50 text-emerald-700 border-solid border-emerald-400 relative"
  };

  return (
    <div 
      onClick={customHandleTap} 
      onContextMenu={handleContextMenu}
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

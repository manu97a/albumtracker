// src/components/TeamGrid.tsx
import StickerCard from './StickerCard';
import { Team, TEAM_FLAGS } from '../lib/constants';

interface TeamGridProps {
  team: Team;
  missing: string[];
  forTrade: Record<string, number>;
  currentUser: string; // <-- Agregamos esta línea
  onStickerChange?: (
    code: string,
    status: 'missing' | 'owned' | 'forTrade',
    count: number,
  ) => void;
}

export default function TeamGrid({
  team,
  missing,
  forTrade,
  currentUser,
  onStickerChange,
}: TeamGridProps) {
  const stickerNumbers = Array.from({ length: team.stickersCount }, (_, i) => i + 1);

  return (
    <div className="mb-8 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
          {team.code}
        </span>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {team.name}
          {TEAM_FLAGS[team.code] && (
            <span aria-hidden="true">{TEAM_FLAGS[team.code]}</span>
          )}
        </h2>
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {stickerNumbers.map((num) => {
          const code = `${team.code}-${num}`;
          let status: 'missing' | 'owned' | 'forTrade' = 'owned'; 
          let count = 0;

          if (missing.includes(code)) {
            status = 'missing';
          } else if (forTrade[code]) {
            status = 'forTrade';
            count = forTrade[code];
          }

          return (
            <StickerCard 
              key={code} 
              code={code} 
              initialStatus={status} 
              initialTradeCount={count}
              // ¡NUEVO! Le pasamos el usuario al botón
              currentUser={currentUser} 
              onStatusChange={onStickerChange}
            />
          );
        })}
      </div>
    </div>
  );
}

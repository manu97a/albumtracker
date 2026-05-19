// src/app/[username]/page.tsx
"use client";
import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { TEAMS } from "../../lib/constants";
import TeamGrid from "../../components/TeamGrid";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

type StickerStatus = "missing" | "owned" | "forTrade";

interface AlbumData {
  missing?: string[];
  forTrade?: Record<string, number>;
  phone?: string;
}

const teamOrder = new Map(TEAMS.map((team, index) => [team.code, index]));
const teamLabels: Record<string, string> = {
  FWC: "FWC",
  MEX: "MEX 🇲🇽",
  RSA: "RSA 🇿🇦",
  KOR: "KOR 🇰🇷",
  CZE: "CZE 🇨🇿",
  CAN: "CAN 🇨🇦",
  BIH: "BIH 🇧🇦",
  QAT: "QAT 🇶🇦",
  SUI: "SUI 🇨🇭",
  BRA: "BRA 🇧🇷",
  MAR: "MAR 🇲🇦",
  HAI: "HAI 🇭🇹",
  SCO: "SCO 🏴",
  USA: "USA 🇺🇸",
  PAR: "PAR 🇵🇾",
  AUS: "AUS 🇦🇺",
  TUR: "TUR 🇹🇷",
  GER: "GER 🇩🇪",
  CUW: "CUW 🇨🇼",
  CIV: "CIV 🇨🇮",
  ECU: "ECU 🇪🇨",
  NED: "NED 🇳🇱",
  JPN: "JPN 🇯🇵",
  SWE: "SWE 🇸🇪",
  TUN: "TUN 🇹🇳",
  BEL: "BEL 🇧🇪",
  EGY: "EGY 🇪🇬",
  IRN: "IRN 🇮🇷",
  NZL: "NZL 🇳🇿",
  ESP: "ESP 🇪🇸",
  CPV: "CPV 🇨🇻",
  KSA: "KSA 🇸🇦",
  URU: "URU 🇺🇾",
  FRA: "FRA 🇫🇷",
  SEN: "SEN 🇸🇳",
  IRQ: "IRQ 🇮🇶",
  NOR: "NOR 🇳🇴",
  ARG: "ARG 🇦🇷",
  ALG: "ALG 🇩🇿",
  AUT: "AUT 🇦🇹",
  JOR: "JOR 🇯🇴",
  POR: "POR 🇵🇹",
  COD: "COD 🇨🇩",
  UZB: "UZB 🇺🇿",
  COL: "COL 🇨🇴",
  ENG: "ENG 🏴",
  CRO: "CRO 🇭🇷",
  GHA: "GHA 🇬🇭",
  PAN: "PAN 🇵🇦",
};

function sortStickerEntries(entries: [string, number][]) {
  return entries.sort(([codeA], [codeB]) => {
    const [teamA, numberA] = codeA.split("-");
    const [teamB, numberB] = codeB.split("-");
    const teamDiff =
      (teamOrder.get(teamA) ?? Number.MAX_SAFE_INTEGER) -
      (teamOrder.get(teamB) ?? Number.MAX_SAFE_INTEGER);

    if (teamDiff !== 0) return teamDiff;

    return Number(numberA) - Number(numberB);
  });
}

function getDuplicateEntries(forTrade: Record<string, number> = {}) {
  return sortStickerEntries(
    Object.entries(forTrade).filter(([, count]) => Number(count) > 0),
  );
}

function getMissingEntries(missing: string[] = []) {
  return sortStickerEntries(missing.map((code) => [code, 1]));
}

function groupStickerEntries(entries: [string, number][]) {
  return entries.reduce<Record<string, string[]>>(
    (groups, [code, count]) => {
      const [teamCode, stickerNumber] = code.split("-");
      groups[teamCode] = groups[teamCode] || [];

      for (let index = 0; index < count; index += 1) {
        groups[teamCode].push(stickerNumber);
      }

      return groups;
    },
    {},
  );
}

function formatDuplicateText(username: string, entries: [string, number][]) {
  const groupedDuplicates = groupStickerEntries(entries);
  return [
    `Mis cromos repetidos (${username}):`,
    ...Object.entries(groupedDuplicates).map(
      ([teamCode, stickerNumbers]) => `${teamCode}: ${stickerNumbers.join(", ")}`,
    ),
  ].join("\n");
}

function formatMissingText(username: string, entries: [string, number][]) {
  const groupedMissing = groupStickerEntries(entries);

  return [
    `Mis cromos faltantes (${username}):`,
    ...Object.entries(groupedMissing).map(
      ([teamCode, stickerNumbers]) => `${teamCode}: ${stickerNumbers.join(", ")}`,
    ),
  ].join("\n");
}

function parseSharedRepeatedText(text: string) {
  const parsedEntries: [string, number][] = [];

  text.split("\n").forEach((line) => {
    const match = line.trim().match(/^([A-Z]{3})\b.*:\s*(.+)$/);
    if (!match) return;

    const [, teamCode, numbersText] = match;
    const stickerNumbers = numbersText.match(/\d+/g) || [];

    stickerNumbers.forEach((stickerNumber) => {
      parsedEntries.push([`${teamCode}-${Number(stickerNumber)}`, 1]);
    });
  });

  return parsedEntries;
}

function formatUsefulMatchesText(entries: [string, number][]) {
  const groupedMatches = groupStickerEntries(entries);

  return [
    "Me sirven",
    ...Object.entries(groupedMatches).map(
      ([teamCode, stickerNumbers]) =>
        `${teamLabels[teamCode] || teamCode}: ${stickerNumbers.join(", ")}`,
    ),
  ].join("\n");
}

export default function Dashboard({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { data: session } = useSession();
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [phone, setPhone] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [areDuplicatesCopied, setAreDuplicatesCopied] = useState(false);
  const [areMissingCopied, setAreMissingCopied] = useState(false);
  const [comparisonText, setComparisonText] = useState("");
  const [comparisonStatus, setComparisonStatus] = useState("");

  const resolvedParams = use(params);
  const currentUsername = resolvedParams.username;
  const viewerAlias = session?.user?.email
    ? session.user.email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
    : null;
  const isOwner = viewerAlias === currentUsername;

  useEffect(() => {
    // Cargamos los datos del álbum
    fetch(`/api/album?user=${currentUsername}`)
      .then((res) => res.json())
      .then((data: AlbumData) => {
        setAlbumData(data);
        setPhone(data.phone || ""); // <-- AGREGA ESTA LÍNEA
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando el álbum:", err);
        setIsLoading(false);
      });
  }, [currentUsername]);

  const filteredTeams = TEAMS.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${currentUsername}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleStickerChange = (
    code: string,
    status: StickerStatus,
    count: number,
  ) => {
    setAlbumData((currentData) => {
      const nextMissing = new Set<string>(currentData?.missing || []);
      const nextForTrade = { ...(currentData?.forTrade || {}) };

      nextMissing.delete(code);
      delete nextForTrade[code];

      if (status === "missing") {
        nextMissing.add(code);
      }

      if (status === "forTrade" && count > 0) {
        nextForTrade[code] = count;
      }

      return {
        ...(currentData || {}),
        missing: Array.from(nextMissing),
        forTrade: nextForTrade,
      };
    });
  };

  const handleCopyDuplicates = () => {
    const duplicates = getDuplicateEntries(albumData?.forTrade || {});
    if (duplicates.length === 0) return;

    const text = formatDuplicateText(currentUsername, duplicates);

    navigator.clipboard.writeText(text).then(() => {
      setAreDuplicatesCopied(true);
      setTimeout(() => setAreDuplicatesCopied(false), 2000);
    });
  };

  const handleCopyMissing = () => {
    const missing = getMissingEntries(albumData?.missing || []);
    if (missing.length === 0) return;

    const text = formatMissingText(currentUsername, missing);

    navigator.clipboard.writeText(text).then(() => {
      setAreMissingCopied(true);
      setTimeout(() => setAreMissingCopied(false), 2000);
    });
  };

  const handleCompareSharedText = () => {
    const missingCodes = new Set(albumData?.missing || []);
    const usefulMatches = parseSharedRepeatedText(comparisonText).filter(
      ([code]) => missingCodes.has(code),
    );

    if (usefulMatches.length === 0) {
      setComparisonStatus("No encontré cromos que te sirvan en ese texto.");
      return;
    }

    const text = formatUsefulMatchesText(sortStickerEntries(usefulMatches));

    navigator.clipboard.writeText(text).then(() => {
      setComparisonStatus(
        `${usefulMatches.length} cromos que te sirven copiados al portapapeles.`,
      );
    });
  };

  const handleSavePhone = async () => {
    setSaveStatus("Guardando...");
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUsername, phone }),
      });
      setSaveStatus("¡Guardado!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("Error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-xl text-gray-500">
        Cargando álbum...
      </div>
    );
  }

  const duplicateEntries = getDuplicateEntries(albumData?.forTrade || {});
  const missingEntries = getMissingEntries(albumData?.missing || []);

  // Si no es el dueño, mostramos la vista pública y le enviamos quién está mirando
  if (!isOwner) {
    return (
      <PublicView
        username={currentUsername}
        data={albumData}
        viewerAlias={viewerAlias}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center flex flex-col items-center">
          {/* Título limpio y elegante */}
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
            Álbum de {currentUsername}
          </h1>

          <div
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full cursor-pointer hover:bg-slate-50 shadow-sm transition-all text-sm"
          >
            <span className="text-slate-500">Enlace público:</span>
            <span className="font-mono text-indigo-600 font-medium">
              {typeof window !== "undefined"
                ? window.location.host
                : "tusitio.com"}
              /{currentUsername}
            </span>
            <span
              className={`ml-2 text-xs font-bold px-2 py-1 rounded ${isCopied ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
            >
              {isCopied ? "¡Copiado!" : "Copiar"}
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
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCopyDuplicates}
                disabled={duplicateEntries.length === 0}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-full transition-colors shadow-sm"
              >
                {areDuplicatesCopied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {areDuplicatesCopied ? "Repetidos copiados" : "Copiar mis repetidos"}
              </button>
              <button
                type="button"
                onClick={handleCopyMissing}
                disabled={missingEntries.length === 0}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-full transition-colors shadow-sm"
              >
                {areMissingCopied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {areMissingCopied ? "Faltantes copiados" : "Copiar mis faltantes"}
              </button>
            </div>
            <span className="text-xs text-slate-500">
              {duplicateEntries.length > 0
                ? `${duplicateEntries.length} cromos listos para compartir`
                : "Aún no tienes repetidos para copiar"}
            </span>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-white p-2 rounded-full border border-slate-200 shadow-sm">
            <span className="pl-3 text-slate-500 text-sm">📱 WhatsApp:</span>
            <input
              type="text"
              placeholder="+593987654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="outline-none bg-transparent text-sm text-slate-700 w-32 placeholder-slate-300"
            />
            <button
              onClick={handleSavePhone}
              className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-slate-700 transition-colors"
            >
              {saveStatus || "Guardar"}
            </button>
          </div>
        </header>

        <section className="mb-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1">
              <label
                htmlFor="comparisonText"
                className="block text-sm font-bold text-slate-700 mb-2"
              >
                Comparar repetidas de otra persona
              </label>
              <textarea
                id="comparisonText"
                value={comparisonText}
                onChange={(event) => {
                  setComparisonText(event.target.value);
                  setComparisonStatus("");
                }}
                placeholder="Pega aquí el texto de Repetidas..."
                className="w-full min-h-36 resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="md:w-64 flex flex-col gap-2 md:pt-8">
              <button
                type="button"
                onClick={handleCompareSharedText}
                disabled={!comparisonText.trim() || missingEntries.length === 0}
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 px-5 rounded-full transition-colors shadow-sm"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Comparar y copiar
              </button>
              {comparisonStatus && (
                <p className="text-xs text-slate-500 text-center md:text-left">
                  {comparisonStatus}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* --- NUEVO: BARRA DE BÚSQUEDA --- */}
        <div className="mb-8 relative max-w-lg mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-slate-400">🔍</span>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all text-slate-700"
            placeholder="Buscar por país o código (ej. ARG, México)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              ✖
            </button>
          )}
        </div>

        {/* --- NUEVO: RENDERIZADO FILTRADO --- */}
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team) => (
            <TeamGrid 
              key={team.code} 
              team={team} 
              missing={albumData?.missing || []} 
              forTrade={albumData?.forTrade || {}}
              currentUser={currentUsername} 
              onStickerChange={handleStickerChange}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-lg">
              No se encontraron equipos para{" "}
              <span className="font-bold">{searchQuery}</span>
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// ==========================================
// COMPONENTE: LA VISTA PARA TUS AMIGOS
// ==========================================
function PublicView({
  username,
  data,
  viewerAlias,
}: {
  username: string;
  data: AlbumData | null;
  viewerAlias: string | null;
}) {
  const [viewerData, setViewerData] = useState<AlbumData | null>(null);

  // Cuando cargue la vista, si estás logueado, traemos TU álbum por detrás
  useEffect(() => {
    if (viewerAlias) {
      fetch(`/api/album?user=${viewerAlias}`)
        .then((res) => res.json())
        .then((resData: AlbumData) => setViewerData(resData))
        .catch((err) => console.error("Error cargando tus datos:", err));
    }
  }, [viewerAlias]);

  const missingCount = data?.missing?.length || 0;
  const forTradeList = Object.entries(data?.forTrade || {});
  const viewerMissing = viewerData?.missing || [];

  // LOGICA DE MATCH: Filtramos los cromos que él tiene repetidos, revisando si están en tu lista de faltantes
  const perfectMatches = forTradeList.filter(([code]) =>
    viewerMissing.includes(code),
  );

  // PREPARAMOS EL MENSAJE DINÁMICO
  const hasPhone = Boolean(data?.phone);
  // Extraemos solo los códigos (ej: "QAT-8, TUR-20")
  const matchCodes = perfectMatches.map(([code]) => code).join(", ");
  // Armamos el texto para WhatsApp
  const waMessage = `¡Hola! Vi tu álbum en la comunidad. Tienes cromos repetidos que me faltan (${matchCodes}). ¿Intercambiamos?`;
  const waLink = `https://wa.me/${data?.phone?.replace(/\+/g, "")}?text=${encodeURIComponent(waMessage)}`;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Álbum de {username}
          </h1>
          <p className="text-slate-500">
            Revisa lo que le falta y lo que tiene repetido para intercambiar.
          </p>
        </div>

        {/* --- SECCIÓN DE MATCH CON WHATSAPP INTEGRADO --- */}
        {viewerAlias && perfectMatches.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-indigo-800 mb-2 flex items-center justify-center gap-2">
              ¡Intercambia con {username}!
            </h2>
            <p className="text-indigo-600 mb-4">
              Tiene <strong>{perfectMatches.length}</strong> cromos repetidos
              que a ti te faltan:
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {perfectMatches.map(([code]) => (
                <span
                  key={code}
                  className="bg-white border border-indigo-300 text-indigo-700 px-4 py-1.5 rounded-lg font-bold text-sm shadow-sm"
                >
                  {code}
                </span>
              ))}
            </div>

            {/* Solo mostramos el botón si el usuario registró su teléfono */}
            {hasPhone ? (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm transform hover:scale-105"
              >
                💬 Enviar oferta por WhatsApp
              </a>
            ) : (
              <p className="text-sm text-indigo-400 italic">
                El usuario no ha registrado su número de contacto.
              </p>
            )}
          </div>
        )}

        {/* Columnas originales */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Columna: Lo que ofrezco */}
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <span className="bg-emerald-200 text-emerald-800 rounded-full w-8 h-8 flex items-center justify-center">
                🔁
              </span>
              Tiene para cambiar
            </h2>
            {forTradeList.length === 0 ? (
              <p className="text-emerald-600 italic">Aún no tiene repetidos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {forTradeList.map(([code, count]) => (
                  <span
                    key={code}
                    className="bg-white border border-emerald-300 text-emerald-700 px-3 py-1 rounded-lg font-bold text-sm shadow-sm"
                  >
                    {code}{" "}
                    <span className="bg-emerald-500 text-white rounded-full px-2 py-0.5 ml-1 text-xs">
                      {String(count)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Columna: Lo que busco */}
          <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
            <h2 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
              <span className="bg-orange-200 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center">
                🔍
              </span>
              Le faltan ({missingCount})
            </h2>
            {missingCount === 0 ? (
              <p className="text-orange-600 italic">¡Álbum completo!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data?.missing?.map((code: string) => (
                  <span
                    key={code}
                    className="bg-white border border-orange-200 text-orange-600 px-3 py-1 rounded-lg font-mono text-sm shadow-sm"
                  >
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

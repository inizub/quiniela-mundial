import { EQUIPO_POR_CODIGO } from "./datos/equipos";
import Bandera from "./Bandera";

// Estructura del bracket simétrico. Cada lado tiene R32 (8 partidos), R16 (4),
// cuartos (2), semifinal (1). El centro tiene final y 3er lugar.
const LADO_IZQ = {
  r32: ["M74", "M77", "M73", "M75", "M83", "M84", "M81", "M82"],
  r16: ["M89", "M90", "M93", "M94"],
  cuartos: ["M97", "M98"],
  semi: "M101",
};
const LADO_DER = {
  r32: ["M76", "M78", "M79", "M80", "M86", "M88", "M85", "M87"],
  r16: ["M91", "M92", "M95", "M96"],
  cuartos: ["M99", "M100"],
  semi: "M102",
};

// Una celda de partido: dos equipos con su marcador.
function Celda({ partido, rondas, marcadores, lado = "izq" }) {
  // Buscar el partido en cualquier ronda resuelta.
  let equipos = [null, null];
  for (const clave in rondas) {
    if (rondas[clave][partido]) {
      equipos = rondas[clave][partido];
      break;
    }
  }
  const m = marcadores[partido] || {};
  const tieneMarcador = m.local !== "" && m.local != null && m.visita !== "" && m.visita != null;

  function Fila({ codigo, goles, ganador }) {
    const eq = codigo ? EQUIPO_POR_CODIGO[codigo] : null;
    return (
      <div
        className={
          "flex items-center gap-1.5 px-2 py-1 " +
          (lado === "der" ? "flex-row-reverse text-right " : "") +
          (ganador ? "font-bold text-slate-800" : "text-slate-500")
        }
      >
        {eq ? <Bandera iso={eq.iso} tam={18} /> : <span className="w-[18px]" />}
        <span className="text-[11px] flex-1 truncate">{eq ? eq.abrev : "—"}</span>
        {tieneMarcador && (
          <span className="text-[11px] font-bold tabular-nums w-3 text-center">
            {goles}
          </span>
        )}
      </div>
    );
  }

  // ¿Quién ganó (para resaltar)? Si hay marcador, el de más goles.
  let ganIdx = null;
  if (tieneMarcador) {
    ganIdx = Number(m.local) > Number(m.visita) ? 0 : Number(m.visita) > Number(m.local) ? 1 : null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm w-32">
      <Fila codigo={equipos[0]} goles={m.local} ganador={ganIdx === 0} />
      <div className="border-t border-slate-100" />
      <Fila codigo={equipos[1]} goles={m.visita} ganador={ganIdx === 1} />
    </div>
  );
}

export default function VistaBracketCompleto({ rondas, marcadores, campeon, onCerrar, nombre }) {
  const campEq = campeon ? EQUIPO_POR_CODIGO[campeon] : null;

  // Columna de partidos con separación vertical.
  function Columna({ partidos, lado, gap = "gap-3" }) {
    return (
      <div className={"flex flex-col justify-around " + gap}>
        {partidos.map((p) => (
          <Celda key={p} partido={p} rondas={rondas} marcadores={marcadores} lado={lado} />
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
      {/* Cabecera */}
      <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
      <h2 className="text-sm font-bold">{nombre ? `Bracket de ${nombre}` : "Mi bracket completo"}</h2>
        <button
          onClick={onCerrar}
          className="text-sm bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 font-medium"
        >
          Cerrar
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 py-1 shrink-0">
        Gira el teléfono y haz zoom para verlo completo. Desliza para recorrerlo.
      </p>

      {/* Lienzo con scroll */}
      <div className="flex-1 overflow-auto p-4">
        <div className="inline-flex items-stretch gap-2 min-w-max">
          {/* LADO IZQUIERDO: R32 -> R16 -> Cuartos -> Semi */}
          <Columna partidos={LADO_IZQ.r32} lado="izq" gap="gap-2" />
          <Columna partidos={LADO_IZQ.r16} lado="izq" gap="gap-8" />
          <Columna partidos={LADO_IZQ.cuartos} lado="izq" gap="gap-24" />
          <div className="flex flex-col justify-center">
            <Celda partido={LADO_IZQ.semi} rondas={rondas} marcadores={marcadores} lado="izq" />
          </div>

          {/* CENTRO: Final + campeón + 3er lugar */}
          <div className="flex flex-col justify-center items-center px-2 gap-3">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">Final</p>
              <Celda partido="M104" rondas={rondas} marcadores={marcadores} lado="izq" />
            </div>
            {campEq && (
              <div className="text-center bg-amber-50 border-2 border-amber-300 rounded-lg px-3 py-2">
                <p className="text-lg">👑</p>
                <Bandera iso={campEq.iso} tam={32} className="mx-auto" />
                <p className="text-xs font-bold text-amber-800 mt-1">{campEq.abrev}</p>
                <p className="text-[9px] text-amber-600">Campeón</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">3er lugar</p>
              <Celda partido="M103" rondas={rondas} marcadores={marcadores} lado="izq" />
            </div>
          </div>

          {/* LADO DERECHO: Semi -> Cuartos -> R16 -> R32 */}
          <div className="flex flex-col justify-center">
            <Celda partido={LADO_DER.semi} rondas={rondas} marcadores={marcadores} lado="der" />
          </div>
          <Columna partidos={LADO_DER.cuartos} lado="der" gap="gap-24" />
          <Columna partidos={LADO_DER.r16} lado="der" gap="gap-8" />
          <Columna partidos={LADO_DER.r32} lado="der" gap="gap-2" />
        </div>
      </div>
    </div>
  );
}
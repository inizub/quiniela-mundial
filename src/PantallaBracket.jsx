import { useState, useEffect } from "react";
import { EQUIPO_POR_CODIGO } from "./datos/equipos";
import { RONDAS } from "./datos/cruces";
import { construirRound32, resolverBracketCompleto, detectarEmpatesFairPlay } from "./logica/motorBracket";
import { construirBracketReal, prepararParaPuntaje } from "./logica/bracketReal";
import { puntosEliminatorias } from "./logica/motorPuntaje";
import { leerResultados, leerBracketReal } from "./admin";
import Bandera from "./Bandera";
import VistaBracketCompleto from "./VistaBracketCompleto";

function Equipo({ codigo, alineado = "left" }) {
  if (!codigo) return <span className="text-slate-300 text-sm">— por definir —</span>;
  const eq = EQUIPO_POR_CODIGO[codigo];
  if (!eq) return <span className="text-sm">{codigo}</span>;
  return (
    <span className={"flex items-center gap-2 text-sm font-medium " + (alineado === "right" ? "flex-row-reverse" : "")}>
      <Bandera iso={eq.iso} tam={28} />
      <span>{eq.abrev}</span>
    </span>
  );
}

export default function PantallaBracket({ marcadoresGrupos, bracketPred, ordenFairPlay, onCambio, bloqueado }) {
  const [rondaActiva, setRondaActiva] = useState("R32");
  const [resultadosGruposReales, setResultadosGruposReales] = useState({});
  const [bracketRealRaw, setBracketRealRaw] = useState(null);
  const [vistaCompleta, setVistaCompleta] = useState(false);

  useEffect(() => {
    leerResultados().then(setResultadosGruposReales);
    leerBracketReal().then(setBracketRealRaw);
  }, []);

  const base = construirRound32(marcadoresGrupos || {}, ordenFairPlay || {});

  const totalGrupos = Object.keys(marcadoresGrupos || {}).filter((id) => {
    const m = marcadoresGrupos[id];
    return m && m.local !== "" && m.visita !== "" && m.local != null && m.visita != null;
  }).length;
  const gruposCompletos = totalGrupos === 72;

  const empatesPendientes = (() => {
    if (!gruposCompletos) return [];
    const empates = detectarEmpatesFairPlay(marcadoresGrupos || {});
    return empates.filter((e) => !(ordenFairPlay && ordenFairPlay[e.grupo]));
  })();

  const avances = bracketPred?.avances || {};
  const marcadores = bracketPred?.marcadores || {};

  const resuelto = resolverBracketCompleto(base.r32, avances);

  // El campeón = ganador de la final (M104), según el avance elegido.
  const campeon = (() => {
    const finalEqs = resuelto.rondas.FINAL?.M104 || [null, null];
    const idx = avances.M104;
    if (idx == null || !finalEqs[idx]) return null;
    const c = finalEqs[idx];
    return (typeof c === "string" && !c.startsWith("W") && !c.startsWith("L")) ? c : null;
  })();

  const hayBracketReal =
    Object.keys(resultadosGruposReales).length === 72 && bracketRealRaw;

  let desglosePuntos = {};
  if (hayBracketReal) {
    const real = construirBracketReal(
      resultadosGruposReales,
      bracketRealRaw.marcadoresElim || {},
      bracketRealRaw.avancesElim || {},
      bracketRealRaw.correccionesR32 || {}
    );
    const predParaPuntaje = prepararParaPuntaje(resuelto, marcadores, avances);
    const realParaPuntaje = prepararParaPuntaje(real, bracketRealRaw.marcadoresElim || {}, bracketRealRaw.avancesElim || {});
    const calc = puntosEliminatorias(predParaPuntaje, realParaPuntaje);
    desglosePuntos = calc.desglose;
  }

  function cambiarMarcador(partido, lado, valor) {
    if (valor !== "" && !/^\d{1,2}$/.test(valor)) return;
    const nuevos = { ...marcadores, [partido]: { ...marcadores[partido], [lado]: valor } };
    onCambio({ avances, marcadores: nuevos });
  }

  function elegirAvance(partido, idx) {
    onCambio({ avances: { ...avances, [partido]: idx }, marcadores });
  }

  function avanceSegunMarcador(partido) {
    const m = marcadores[partido] || {};
    if (m.local === "" || m.visita === "" || m.local == null || m.visita == null) return null;
    const l = Number(m.local), v = Number(m.visita);
    if (l > v) return 0;
    if (v > l) return 1;
    return "empate";
  }

  if (!gruposCompletos) {
    return (
      <main className="p-4 max-w-md mx-auto pb-24">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-4 text-center">
          <p className="text-3xl mb-2">🔒</p>
          <p className="font-semibold text-slate-700 mb-1">Bracket bloqueado</p>
          <p className="text-sm text-slate-500">
            Primero completa los marcadores de los 72 partidos de fase de grupos.
            Llevas {totalGrupos}/72. Cuando los completes, tu bracket se armará solo aquí.
          </p>
        </div>
      </main>
    );
  }

  if (!base.hayPatron) {
    return (
      <main className="p-4 max-w-md mx-auto pb-24">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-4 text-sm text-red-700">
          Hubo un problema al determinar los mejores terceros con estos marcadores.
          Avísale al administrador.
        </div>
      </main>
    );
  }

  const ronda = RONDAS.find((r) => r.clave === rondaActiva);

  return (
    <main className="max-w-md mx-auto pb-40">
      {vistaCompleta && (
        <VistaBracketCompleto
          rondas={resuelto.rondas}
          marcadores={marcadores}
          campeon={campeon}
          onCerrar={() => setVistaCompleta(false)}
        />
      )}

      <nav className="flex overflow-x-auto gap-2 px-3 py-3 bg-white border-b sticky top-[60px] z-10">
        {RONDAS.map((r) => (
          <button
            key={r.clave}
            onClick={() => setRondaActiva(r.clave)}
            className={
              "shrink-0 px-3 h-9 rounded-full text-xs font-semibold transition " +
              (rondaActiva === r.clave ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600")
            }
          >
            {r.nombre}
          </button>
        ))}
      </nav>

      <div className="p-4">
        {empatesPendientes.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            ⚖️ Tienes empates por fair play sin ordenar en{" "}
            {empatesPendientes.map((e) => "Grupo " + e.grupo).join(", ")}. Ve a la
            pestaña <strong>Predicciones</strong> para definir el orden — afecta cómo se arma tu bracket.
          </div>
        )}

        <button
          onClick={() => setVistaCompleta(true)}
          className="mb-4 w-full bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5"
        >
          📷 Ver bracket completo
        </button>

        <h2 className="text-base font-semibold text-slate-700 mb-1">{ronda.nombre}</h2>
        <p className="text-xs text-slate-400 mb-4">
          Predice el marcador del <strong>tiempo reglamentario</strong> (90 min). Si
          hay empate, elige quién avanza — la prórroga y los penales no afectan tus puntos.
        </p>

        <ul className="space-y-3">
          {ronda.partidos.map((partido) => {
            const equipos = resuelto.rondas[rondaActiva][partido] || [null, null];
            const m = marcadores[partido] || {};
            const avance = avanceSegunMarcador(partido);
            const esEmpate = avance === "empate";
            const equiposResueltos =
              equipos[0] && equipos[1] &&
              !String(equipos[0]).startsWith("W") &&
              !String(equipos[0]).startsWith("L") &&
              !String(equipos[1]).startsWith("W") &&
              !String(equipos[1]).startsWith("L");
            const puntos = equiposResueltos ? desglosePuntos[partido] : null;

            if (avance === 0 || avance === 1) {
              if (avances[partido] !== avance) {
                setTimeout(() => elegirAvance(partido, avance), 0);
              }
            }

            return (
              <li key={partido} className="bg-white rounded-xl px-3 py-3 shadow-sm">
                <p className="text-center text-[10px] text-slate-300 mb-2">{partido}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0"><Equipo codigo={equipos[0]} /></div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text" inputMode="numeric"
                      disabled={bloqueado || !equipos[0] || !equipos[1]}
                      value={m.local || ""}
                      onChange={(e) => cambiarMarcador(partido, "local", e.target.value)}
                      className="w-10 h-10 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                    />
                    <span className="text-slate-300 font-bold">:</span>
                    <input
                      type="text" inputMode="numeric"
                      disabled={bloqueado || !equipos[0] || !equipos[1]}
                      value={m.visita || ""}
                      onChange={(e) => cambiarMarcador(partido, "visita", e.target.value)}
                      className="w-10 h-10 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex justify-end"><Equipo codigo={equipos[1]} alineado="right" /></div>
                </div>

                {esEmpate && equipos[0] && equipos[1] && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-amber-600 font-medium mb-2">
                      Empate en el tiempo reglamentario. ¿Quién avanza? (prórroga o
                      penales — no afecta tus puntos)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => elegirAvance(partido, 0)}
                        disabled={bloqueado}
                        className={"flex-1 py-2 rounded-lg text-sm font-semibold border " + (avances[partido] === 0 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600")}
                      >
                        {EQUIPO_POR_CODIGO[equipos[0]]?.abrev}
                      </button>
                      <button
                        onClick={() => elegirAvance(partido, 1)}
                        disabled={bloqueado}
                        className={"flex-1 py-2 rounded-lg text-sm font-semibold border " + (avances[partido] === 1 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600")}
                      >
                        {EQUIPO_POR_CODIGO[equipos[1]]?.abrev}
                      </button>
                    </div>
                  </div>
                )}

                {puntos && (
                  <div className={"mt-3 -mx-3 -mb-3 px-3 py-2.5 rounded-b-xl border-l-4 " + (puntos.pts > 0 ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        {puntos.motivos.length > 0 ? (
                          puntos.motivos.map((mot, i) => (
                            <span key={i} className="text-[11px] leading-tight text-emerald-700 font-medium">{mot}</span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Sin aciertos</span>
                        )}
                      </div>
                      <span className={"text-base font-extrabold tabular-nums " + (puntos.pts > 0 ? "text-emerald-600" : "text-slate-400")}>
                        {puntos.pts > 0 ? "+" + puntos.pts : "0"}
                      </span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
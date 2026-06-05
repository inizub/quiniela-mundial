import { useState, useEffect } from "react";
import { EQUIPO_POR_CODIGO } from "./datos/equipos";
import { RONDAS } from "./datos/cruces";
import { leerResultados, leerBracketReal, guardarBracketReal } from "./admin";
import { construirBracketReal } from "./logica/bracketReal";
import { detectarEmpatesFairPlay, empatesTerceros } from "./logica/motorBracket";
import Bandera from "./Bandera";
import DesempateTerceros from "./DesempateTerceros";

// Muestra un equipo (bandera + abreviatura) o un guion si no está definido.
function Equipo({ codigo }) {
  if (!codigo) return <span className="text-slate-300 text-sm">— por definir —</span>;
  const eq = EQUIPO_POR_CODIGO[codigo];
  if (!eq) return <span className="text-sm">{codigo}</span>;
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium">
      <Bandera iso={eq.iso} tam={24} />
      <span>{eq.abrev}</span>
    </span>
  );
}

export default function AdminEliminatorias() {
  const [resultadosGrupos, setResultadosGrupos] = useState({});
  const [bracketReal, setBracketRealState] = useState({
    marcadoresElim: {},
    avancesElim: {},
    correccionesR32: {},
    ordenFairPlay: {},
    desempateTerceros: [],
  });
  const [rondaActiva, setRondaActiva] = useState("R32");
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState("idle"); // idle | guardando | guardado | error

  async function recargar() {
    const [res, br] = await Promise.all([leerResultados(), leerBracketReal()]);
    setResultadosGrupos(res);
    setBracketRealState({
      marcadoresElim: br.marcadoresElim || {},
      avancesElim: br.avancesElim || {},
      correccionesR32: br.correccionesR32 || {},
      ordenFairPlay: br.ordenFairPlay || {},
      desempateTerceros: br.desempateTerceros || [],
    });
    setCargando(false);
  }
  useEffect(() => {
    recargar();
  }, []);

  // ¿Están los 72 de grupos metidos? Necesario para armar el bracket real.
  const totalGrupos = Object.keys(resultadosGrupos).length;
  const gruposCompletos = totalGrupos === 72;

  if (cargando)
    return <p className="text-center text-slate-400 mt-6">Cargando…</p>;

  if (!gruposCompletos) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        🔒 Para armar el bracket real necesitas haber metido los <strong>72
        resultados de fase de grupos</strong> primero (llevas {totalGrupos}/72).
        Ve a la pestaña "Resultados reales" y complétalos.
      </div>
    );
  }

  // Detectar empates de grupo que solo se resuelven por fair play.
  const empatesFairPlay = detectarEmpatesFairPlay(resultadosGrupos);

  // Detectar empates de terceros (corte 8º/9º) del Mundial real.
  const empatesTerc = empatesTerceros(
    resultadosGrupos,
    bracketReal.ordenFairPlay || {},
    bracketReal.desempateTerceros || []
  );

  // Armar el bracket real con todo lo que hay (incluye los desempates del admin).
  const real = construirBracketReal(
    resultadosGrupos,
    bracketReal.marcadoresElim,
    bracketReal.avancesElim,
    bracketReal.correccionesR32,
    bracketReal.ordenFairPlay || {},
    bracketReal.desempateTerceros || []
  );

  // --- Guardado ---
  async function guardar(nuevo) {
    const data = nuevo || bracketReal;
    setEstado("guardando");
    const res = await guardarBracketReal(data);
    setEstado(res.error ? "error" : "guardado");
  }

  // Cambiar marcador real de un partido de eliminatoria.
  function cambiarMarcador(partido, lado, valor) {
    if (valor !== "" && !/^\d{1,2}$/.test(valor)) return;
    const nuevo = {
      ...bracketReal,
      marcadoresElim: {
        ...bracketReal.marcadoresElim,
        [partido]: { ...bracketReal.marcadoresElim[partido], [lado]: valor },
      },
    };
    setBracketRealState(nuevo);
    setEstado("idle");
  }

  // Decidir quién avanzó (para empates de eliminatoria).
  function decidirAvance(partido, idx) {
    const nuevo = {
      ...bracketReal,
      avancesElim: { ...bracketReal.avancesElim, [partido]: idx },
    };
    setBracketRealState(nuevo);
    setEstado("idle");
  }

  const ronda = RONDAS.find((r) => r.clave === rondaActiva);

  return (
    <div>
      {/* Aviso de fair play en grupos (si aplica) */}
      {empatesFairPlay.length > 0 && (
        <FairPlayGrupos
          empates={empatesFairPlay}
          bracketReal={bracketReal}
          onGuardar={(nuevo) => {
            setBracketRealState(nuevo);
            guardar(nuevo);
          }}
        />
      )}

      {/* Desempate de terceros del Mundial real (corte 8º/9º) */}
      {empatesTerc.length > 0 && (
        <div className="mb-4">
          <DesempateTerceros
            empates={empatesTerc}
            desempateTerceros={bracketReal.desempateTerceros || []}
            tercerosPorGrupo={real.base.tercerosPorGrupo}
            onCambio={(nuevo) => {
              const actualizado = { ...bracketReal, desempateTerceros: nuevo };
              setBracketRealState(actualizado);
              guardar(actualizado);
            }}
          />
        </div>
      )}

      {/* Tabs de rondas */}
      <nav className="flex overflow-x-auto gap-2 pb-3">
        {RONDAS.map((r) => (
          <button
            key={r.clave}
            onClick={() => setRondaActiva(r.clave)}
            className={
              "shrink-0 px-3 h-9 rounded-full text-xs font-semibold transition " +
              (rondaActiva === r.clave
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 border")
            }
          >
            {r.nombre}
          </button>
        ))}
      </nav>

      <p className="text-xs text-slate-400 mb-3">
        Mete el marcador real (tiempo reglamentario) de cada partido. Si hay
        empate, indica quién avanzó.
      </p>

      <ul className="space-y-3">
        {ronda.partidos.map((partido) => {
          const equipos = real.rondas[rondaActiva][partido] || [null, null];
          const m = bracketReal.marcadoresElim[partido] || {};
          const esEmpate =
            m.local !== "" && m.visita !== "" && m.local != null && m.visita != null &&
            Number(m.local) === Number(m.visita);
          const guardado = m.local != null && m.visita != null && m.local !== "" && m.visita !== "";

          return (
            <li
              key={partido}
              className={"rounded-xl px-3 py-3 shadow-sm " + (guardado ? "bg-emerald-50" : "bg-white")}
            >
              <p className="text-center text-[10px] text-slate-300 mb-2">{partido}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0"><Equipo codigo={equipos[0]} /></div>
                <div className="flex items-center gap-1">
                  <input
                    type="text" inputMode="numeric"
                    disabled={!equipos[0] || !equipos[1]}
                    value={m.local || ""}
                    onChange={(e) => cambiarMarcador(partido, "local", e.target.value)}
                    className="w-9 h-9 text-center font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                  />
                  <span className="text-slate-300 font-bold">:</span>
                  <input
                    type="text" inputMode="numeric"
                    disabled={!equipos[0] || !equipos[1]}
                    value={m.visita || ""}
                    onChange={(e) => cambiarMarcador(partido, "visita", e.target.value)}
                    className="w-9 h-9 text-center font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
                <div className="flex-1 min-w-0 flex justify-end"><Equipo codigo={equipos[1]} /></div>
              </div>

              {/* Empate: quién avanzó */}
              {esEmpate && equipos[0] && equipos[1] && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-amber-600 font-medium mb-2">
                    Empate en el reglamentario. ¿Quién avanzó? (prórroga/penales)
                  </p>
                  <div className="flex gap-2">
                    {[0, 1].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => decidirAvance(partido, idx)}
                        className={
                          "flex-1 py-2 rounded-lg text-sm font-semibold border " +
                          (bracketReal.avancesElim[partido] === idx
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-600")
                        }
                      >
                        {EQUIPO_POR_CODIGO[equipos[idx]]?.abrev}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Barra de guardado */}
      <div className="sticky bottom-16 mt-4">
        <button
          onClick={() => guardar()}
          disabled={estado === "guardando"}
          className="w-full bg-emerald-600 text-white font-semibold rounded-lg py-3 disabled:opacity-60"
        >
          {estado === "guardando" ? "Guardando…" : "Guardar resultados de eliminatorias"}
        </button>
        {estado === "guardado" && (
          <p className="text-center text-emerald-600 text-sm mt-1">✅ Guardado</p>
        )}
        {estado === "error" && (
          <p className="text-center text-red-600 text-sm mt-1">⚠️ Error al guardar</p>
        )}
      </div>
    </div>
  );
}

// --- Aviso de fair play para empates de grupo (flujo normal) ---
function FairPlayGrupos({ empates, bracketReal, onGuardar }) {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
      <p className="text-sm font-semibold text-amber-800 mb-1">
        ⚖️ Desempate por fair play
      </p>
      <p className="text-xs text-amber-700 mb-3">
        En estos grupos hay equipos empatados en todos los criterios deportivos.
        El desempate real fue por fair play (tarjetas), que la app no puede saber.
        Indica el orden real:
      </p>
      {empates.map((emp) => (
        <div key={emp.grupo} className="mb-3">
          <p className="text-xs font-medium text-slate-600 mb-1">
            Grupo {emp.grupo}: empate entre{" "}
            {emp.equipos.map((c) => EQUIPO_POR_CODIGO[c]?.abrev).join(", ")}
          </p>
          <p className="text-[11px] text-slate-400">
            (El selector de orden detallado se afina en la Etapa 7d; por ahora
            queda registrado el aviso.)
          </p>
        </div>
      ))}
    </div>
  );
}
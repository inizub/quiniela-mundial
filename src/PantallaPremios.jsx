import { useState, useEffect } from "react";
import { leerPremiosDeParticipantes, leerPremiosAdjudicados } from "./admin";
import { obtenerPosiciones } from "./posiciones";

const PREMIOS = [
  { clave: "botaOro", titulo: "🥇 Bota de Oro", desc: "Máximo goleador del torneo", pts: 5 },
  { clave: "balonOro", titulo: "🏅 Balón de Oro", desc: "Mejor jugador del torneo", pts: 5 },
  { clave: "asistidor", titulo: "🎯 Máximo asistidor", desc: "Jugador con más asistencias", pts: 3 },
  { clave: "joven", titulo: "🌟 Mejor jugador joven", desc: "Mejor jugador sub-21", pts: 3 },
];

export default function PantallaPremios({ premios, onCambio, bloqueado }) {
  const [verPremio, setVerPremio] = useState(null); // premio abierto en overlay, o null
  const [todos, setTodos] = useState([]);
  const [adjudicados, setAdjudicados] = useState({});

  // Solo cargamos predicciones ajenas cuando ya están cerradas.
  useEffect(() => {
    if (!bloqueado) return;
    Promise.all([
      obtenerPosiciones(),          // ya viene solo con activos y ordenado por puntos
      leerPremiosDeParticipantes(),
      leerPremiosAdjudicados(),
    ]).then(([pos, premiosTodos, adj]) => {
      const premiosPorId = {};
      for (const p of premiosTodos) premiosPorId[p.id] = p.premios;
      const ordenados = pos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        premios: premiosPorId[p.id] || {},
      }));
      setTodos(ordenados);
      setAdjudicados(adj);
    });
  }, [bloqueado]);

  function cambiar(clave, valor) {
    onCambio({ ...premios, [clave]: valor });
  }

  return (
    <main className="p-4 max-w-md mx-auto pb-40">
      {verPremio && (
        <OverlayPremio
          premio={verPremio}
          participantes={todos}
          ganadores={adjudicados[verPremio.clave] || []}
          onCerrar={() => setVerPremio(null)}
        />
      )}

      <h2 className="text-base font-semibold text-slate-700 mb-1 mt-2">
        Premios individuales
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Escribe el <strong>nombre y apellido</strong> del jugador (ej. Kylian Mbappé).
      </p>

      {bloqueado && (
        <div className="mb-3 bg-amber-100 text-amber-800 text-sm rounded-lg px-3 py-2">
          🔒 Las predicciones están cerradas. Toca cada premio para ver lo que puso cada quien.
        </div>
      )}

      <div className="space-y-3">
        {PREMIOS.map((premio) => (
          <div key={premio.clave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-slate-700">{premio.titulo}</span>
              <span className="text-xs font-bold text-emerald-600">+{premio.pts} pts</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">{premio.desc}</p>
            <input
              type="text"
              disabled={bloqueado}
              value={premios[premio.clave] || ""}
              onChange={(e) => cambiar(premio.clave, e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
            />
            {bloqueado && (
              <button
                onClick={() => setVerPremio(premio)}
                className="mt-3 w-full flex items-center justify-center gap-1 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg py-2 active:scale-[0.99] transition-transform"
              >
                Ver predicciones de todos →
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function OverlayPremio({ premio, participantes, ganadores, onCerrar }) {
  const hayAdjudicacion = ganadores.length > 0;
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
      <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-bold truncate">{premio.titulo}</h2>
          <p className="text-[11px] text-emerald-100 truncate">{premio.desc} · +{premio.pts} pts</p>
        </div>
        <button
          onClick={onCerrar}
          className="text-sm bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 font-medium shrink-0 ml-2"
        >
          Salir
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {participantes.length === 0 ? (
          <p className="text-center text-sm text-slate-400 mt-6">Cargando predicciones…</p>
        ) : (
          <>
            <ul className="space-y-2 max-w-md mx-auto">
              {participantes.map((p) => {
                const resp = (p.premios?.[premio.clave] || "").trim();
                const acerto = ganadores.includes(p.id);
                return (
                  <li
                    key={p.id}
                    className={
                      "bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center justify-between gap-3 " +
                      (acerto ? "border-l-4 border-emerald-500" : "")
                    }
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{p.nombre}</p>
                      <p className={"text-sm truncate " + (resp ? "text-slate-500" : "text-slate-300 italic")}>
                        {resp || "— sin respuesta —"}
                      </p>
                    </div>
                    {acerto && (
                      <span className="shrink-0 text-xs font-extrabold text-emerald-600 tabular-nums">
                        ✓ +{premio.pts}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {!hayAdjudicacion && (
              <p className="text-center text-xs text-slate-400 mt-4 max-w-md mx-auto">
                Este premio aún no se ha adjudicado. Cuando el admin marque al ganador, aquí verás quién acertó.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { obtenerPosiciones, suscribirCambios } from "./posiciones";
import { leerDatosDeParticipantes } from "./admin";
import { construirRound32, resolverBracketCompleto } from "./logica/motorBracket";
import VistaBracketCompleto from "./VistaBracketCompleto";

// Un equipo "de verdad" es letra de grupo (A–L) + posición (1–4).
function esEquipoCodigo(e) {
  return /^[A-L][1-4]$/.test(String(e));
}

export default function PantallaPosiciones({ miId, bloqueado }) {
  const [tabla, setTabla] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  // Bracket de la persona seleccionada (solo con predicciones cerradas).
  const [datosTodos, setDatosTodos] = useState({});
  const [verBracket, setVerBracket] = useState(null); // { nombre, rondas, marcadores, campeon } | null

  useEffect(() => {
    let activo = true;
    async function recargar() {
      const datos = await obtenerPosiciones();
      if (activo) {
        setTabla(datos);
        setCargando(false);
        setActualizando(false);
      }
    }
    recargar();
    const cancelar = suscribirCambios(() => {
      setActualizando(true);
      recargar();
    });
    return () => {
      activo = false;
      cancelar();
    };
  }, []);

  // Cargamos las predicciones completas solo cuando ya están cerradas.
  useEffect(() => {
    if (!bloqueado) return;
    leerDatosDeParticipantes().then(setDatosTodos);
  }, [bloqueado]);

  function abrirBracket(fila) {
    if (!bloqueado) return;
    const datos = datosTodos[fila.id];
    if (!datos) return;
    const base = construirRound32(
      datos.marcadoresGrupos || {},
      datos.ordenFairPlay || {},
      datos.desempateTerceros || []
    );
    if (!base.hayPatron) {
      // Bracket incompleto/no armable: mostramos vacío en vez de romper.
      setVerBracket({ nombre: fila.nombre, rondas: {}, marcadores: {}, campeon: null });
      return;
    }
    const avances = datos.bracket?.avances || {};
    const marcadores = datos.bracket?.marcadores || {};
    const resuelto = resolverBracketCompleto(base.r32, avances);

    const finalEqs = resuelto.rondas.FINAL?.M104 || [null, null];
    const idx = avances.M104;
    const campeon =
      idx != null && finalEqs[idx] && esEquipoCodigo(finalEqs[idx]) ? finalEqs[idx] : null;

    setVerBracket({ nombre: fila.nombre, rondas: resuelto.rondas, marcadores, campeon });
  }

  if (cargando)
    return <p className="text-center text-slate-400 mt-10">Cargando posiciones…</p>;

  const medalla = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);
  const podio = tabla.slice(0, 3);
  const ordenPodio = [podio[1], podio[0], podio[2]].filter(Boolean);

  return (
    <main className="p-4 max-w-md mx-auto pb-24">
      {verBracket && (
        <VistaBracketCompleto
          nombre={verBracket.nombre}
          rondas={verBracket.rondas}
          marcadores={verBracket.marcadores}
          campeon={verBracket.campeon}
          onCerrar={() => setVerBracket(null)}
        />
      )}

      {/* Banner */}
      <div className="rounded-2xl overflow-hidden shadow-md mb-5">
        <img src="/banner.png" alt="Mundial 2026" className="w-full block" />
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-base font-bold text-slate-800">Tabla de posiciones</h2>
        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
          <span className={"inline-block w-1.5 h-1.5 rounded-full " + (actualizando ? "bg-amber-400" : "bg-emerald-500")} />
          {actualizando ? "Actualizando…" : "En vivo"}
        </span>
      </div>

      {bloqueado && (
        <p className="text-center text-[11px] text-slate-400 mb-3">
          Toca a cualquier participante para ver su bracket completo.
        </p>
      )}

      {/* Podio */}
      {podio.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5 items-end">
          {ordenPodio.map((p) => {
            const pos = tabla.indexOf(p);
            const esCentro = pos === 0;
            return (
              <div
                key={p.id}
                onClick={() => abrirBracket(p)}
                className={
                  "rounded-2xl text-center px-2 transition-all " +
                  (bloqueado ? "cursor-pointer active:scale-[0.97] " : "") +
                  (esCentro
                    ? "bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 shadow-md py-5"
                    : "bg-white border border-slate-200 shadow-sm py-3")
                }
              >
                <div className={esCentro ? "text-3xl" : "text-2xl"}>{medalla(pos)}</div>
                <div className="font-semibold text-slate-800 text-sm mt-1 truncate">{p.nombre}</div>
                <div className={"font-extrabold " + (esCentro ? "text-2xl text-amber-600" : "text-lg text-slate-700")}>
                  {p.puntos}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista completa */}
      <div className="space-y-2">
        {tabla.map((fila, i) => {
          const soyYo = miId && fila.id === miId;
          return (
            <div
              key={fila.id}
              onClick={() => abrirBracket(fila)}
              className={
                "flex items-center gap-3 rounded-xl px-3 py-3 border transition-all " +
                (bloqueado ? "cursor-pointer active:scale-[0.99] " : "") +
                (soyYo
                  ? "bg-emerald-50 border-emerald-300 shadow-sm"
                  : i < 3
                  ? "bg-amber-50/40 border-amber-100"
                  : "bg-white border-slate-100")
              }
            >
              <div className="w-7 text-center shrink-0">
                {medalla(i) ? (
                  <span className="text-xl">{medalla(i)}</span>
                ) : (
                  <span className="text-slate-400 font-semibold">{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 truncate">
                  {fila.nombre}
                  {soyYo && <span className="ml-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Tú</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Grupos {fila.puntosGrupos} · Elim {fila.puntosElim} · Premios {fila.puntosPremios}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-extrabold text-lg text-emerald-700 leading-none">{fila.puntos}</div>
                <div className="text-[10px] text-slate-400 mt-1">{fila.partidosPredichos}/72</div>
              </div>
              {bloqueado && <span className="text-slate-300 text-lg shrink-0">›</span>}
            </div>
          );
        })}
      </div>

      {tabla.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-6">Aún no hay participantes.</p>
      )}

      <p className="text-center text-xs text-slate-400 mt-5">
        Suma de fase de grupos, eliminatorias y premios. Se actualiza en tiempo real.
      </p>
    </main>
  );
}
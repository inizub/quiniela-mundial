import { useState, useEffect } from "react";
import { obtenerPosiciones, suscribirCambios } from "./posiciones";

export default function PantallaPosiciones({ miId }) {
  const [tabla, setTabla] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

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

  if (cargando)
    return <p className="text-center text-slate-400 mt-10">Cargando posiciones…</p>;

  const medalla = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);
  const podio = tabla.slice(0, 3);
  // Reordena el podio visual: 2º · 1º · 3º (el 1º en el centro y más alto)
  const ordenPodio = [podio[1], podio[0], podio[2]].filter(Boolean);

  return (
    <main className="p-4 max-w-md mx-auto pb-24">
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

      {/* Podio */}
      {podio.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5 items-end">
          {ordenPodio.map((p) => {
            const pos = tabla.indexOf(p);
            const esCentro = pos === 0;
            return (
              <div
                key={p.id}
                className={
                  "rounded-2xl text-center px-2 transition-all " +
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
              className={
                "flex items-center gap-3 rounded-xl px-3 py-3 border transition-all " +
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
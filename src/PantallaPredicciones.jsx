import { useState, useEffect } from 'react';
import { GRUPOS, LETRAS_GRUPOS, EQUIPO_POR_CODIGO } from './datos/equipos';
import { partidosDeGrupo } from './datos/partidos';
import { calcularTabla, empatesDuros } from './logica/clasificacion';
import { puntosPartidoGrupo } from './logica/motorPuntaje';
import { leerResultados } from './admin';
import Bandera from './Bandera';

const ZONAS = {
  MX: { offset: -6 },
  ES: { offset: +2 },
  BO: { offset: -4 },
};

function formatearFecha(fechaUTC, zona) {
  const off = (ZONAS[zona] || ZONAS.MX).offset;
  const d = new Date(new Date(fechaUTC).getTime() + off * 3600 * 1000);
  const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  return `${dias[d.getUTCDay()]} ${d.getUTCDate()}/${
    d.getUTCMonth() + 1
  } · ${String(d.getUTCHours()).padStart(2, '0')}:${String(
    d.getUTCMinutes()
  ).padStart(2, '0')}`;
}

export default function PantallaPredicciones({
  marcadores,
  onCambio,
  ordenFairPlay,
  onCambioFairPlay,
  zona = 'MX',
  bloqueado,
}) {
  const [grupoActivo, setGrupoActivo] = useState('A');
  const [resultadosReales, setResultadosReales] = useState({});

  useEffect(() => {
    leerResultados().then(setResultadosReales);
  }, []);

  function cambiarMarcador(idPartido, lado, valor) {
    if (valor !== '' && !/^\d{1,2}$/.test(valor)) return;
    onCambio({
      ...marcadores,
      [idPartido]: { ...marcadores[idPartido], [lado]: valor },
    });
  }

  const partidos = partidosDeGrupo(grupoActivo);
  const equiposDelGrupo = GRUPOS[grupoActivo].map((e) => e.codigo);

  // ¿El grupo activo tiene sus 6 partidos con marcador completo?
  const grupoCompleto = partidos.every((p) => {
    const m = marcadores[p.id];
    return (
      m &&
      m.local !== '' &&
      m.visita !== '' &&
      m.local != null &&
      m.visita != null
    );
  });

  // Solo buscamos empates de fair play si el grupo está completo.
  const empates = grupoCompleto
    ? empatesDuros(equiposDelGrupo, partidos, marcadores)
    : [];
  const ordenGrupo = (ordenFairPlay && ordenFairPlay[grupoActivo]) || null;

  const tabla = calcularTabla(
    equiposDelGrupo,
    partidos,
    marcadores,
    {},
    ordenGrupo
  );

  function definirOrden(nuevoOrdenDelGrupo) {
    onCambioFairPlay({
      ...(ordenFairPlay || {}),
      [grupoActivo]: nuevoOrdenDelGrupo,
    });
  }

  return (
    <div className="pb-40">
      <nav className="flex overflow-x-auto gap-2 px-3 py-3 bg-white border-b">
        {LETRAS_GRUPOS.map((letra) => (
          <button
            key={letra}
            onClick={() => setGrupoActivo(letra)}
            className={
              'shrink-0 w-11 h-11 rounded-full font-bold text-sm transition ' +
              (grupoActivo === letra
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-100 text-slate-600')
            }
          >
            {letra}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-md mx-auto">
        <h2 className="text-base font-semibold mb-3 text-slate-700">
          Grupo {grupoActivo} · Predice los marcadores
        </h2>

        {bloqueado && (
          <div className="mb-3 bg-amber-100 text-amber-800 text-sm rounded-lg px-3 py-2">
            🔒 Las predicciones están cerradas. Ya no se pueden editar.
          </div>
        )}

        <ul className="space-y-3">
          {partidos.map((p) => {
            const local = EQUIPO_POR_CODIGO[p.local];
            const visita = EQUIPO_POR_CODIGO[p.visita];
            const m = marcadores[p.id] || {};
            return (
              <li
                key={p.id}
                className="bg-white rounded-xl px-3 py-4 shadow-sm"
              >
                <p className="text-center text-xs text-slate-400 mb-3">
                  {formatearFecha(p.fechaUTC, zona)}
                </p>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <Bandera iso={local.iso} tam={44} />
                    <span className="font-semibold text-sm text-slate-700">
                      {local.abrev}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={bloqueado}
                      value={m.local || ''}
                      onChange={(e) =>
                        cambiarMarcador(p.id, 'local', e.target.value)
                      }
                      className="w-11 h-11 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                    />
                    <span className="text-slate-300 text-xs font-medium">
                      vs
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={bloqueado}
                      value={m.visita || ''}
                      onChange={(e) =>
                        cambiarMarcador(p.id, 'visita', e.target.value)
                      }
                      className="w-11 h-11 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <Bandera iso={visita.iso} tam={44} />
                    <span className="font-semibold text-sm text-slate-700">
                      {visita.abrev}
                    </span>
                  </div>
                </div>
                <EtiquetaPuntos prediccion={m} real={resultadosReales[p.id]} />
              </li>
            );
          })}
        </ul>

        <TablaGrupo tabla={tabla} />

        {!bloqueado &&
          empates.map((conjunto, idx) => (
            <DesempateFairPlay
              key={idx}
              conjunto={conjunto}
              ordenActual={ordenGrupo}
              onDefinir={definirOrden}
            />
          ))}
      </main>
    </div>
  );
}

function DesempateFairPlay({ conjunto, ordenActual, onDefinir }) {
  let orden = conjunto;
  if (ordenActual) {
    const enOrden = ordenActual.filter((c) => conjunto.includes(c));
    const faltantes = conjunto.filter((c) => !enOrden.includes(c));
    orden = [...enOrden, ...faltantes];
  }

  function mover(codigo, direccion) {
    const i = orden.indexOf(codigo);
    const j = i + direccion;
    if (j < 0 || j >= orden.length) return;
    const nuevo = [...orden];
    [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
    onDefinir(nuevo);
  }

  return (
    <div className="mt-4 bg-amber-50 border border-amber-300 rounded-xl p-4">
      <p className="text-sm font-semibold text-amber-800 mb-1">
        ⚖️ Empate que decides tú
      </p>
      <p className="text-xs text-amber-700 mb-3">
        Estos equipos quedan empatados en todos los criterios (puntos,
        diferencia de goles y goles). En la realidad se desempataría por fair
        play (tarjetas), algo que no se puede predecir. Ordénalos como crees que
        quedarán — esto afecta tu bracket.
      </p>
      <ul className="space-y-2">
        {orden.map((codigo, i) => {
          const eq = EQUIPO_POR_CODIGO[codigo];
          return (
            <li
              key={codigo}
              className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="text-slate-400 w-4">{i + 1}º</span>
                <Bandera iso={eq.iso} tam={26} />
                {eq.abrev}
              </span>
              <span className="flex gap-1">
                <button
                  onClick={() => mover(codigo, -1)}
                  disabled={i === 0}
                  className="w-8 h-8 rounded bg-slate-100 disabled:opacity-30 font-bold"
                >
                  ↑
                </button>
                <button
                  onClick={() => mover(codigo, +1)}
                  disabled={i === orden.length - 1}
                  className="w-8 h-8 rounded bg-slate-100 disabled:opacity-30 font-bold"
                >
                  ↓
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EtiquetaPuntos({ prediccion, real }) {
  if (!real || real.local == null || real.visita == null) return null;
  const r = puntosPartidoGrupo(prediccion, real);
  const gano = r.puntos > 0;
  const partes = gano ? r.motivo.split(' · ') : [];
  return (
    <div
      className={
        'mt-3 -mx-3 -mb-4 px-3 py-2.5 rounded-b-xl border-l-4 ' +
        (gano
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-slate-300 bg-slate-50')
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
            Final
          </span>
          <span className="text-sm font-bold text-slate-700 tabular-nums">
            {real.local} - {real.visita}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {gano ? (
            <div className="flex flex-col items-end gap-0.5">
              {partes.map((parte, i) => (
                <span
                  key={i}
                  className="text-[11px] leading-tight text-emerald-700 font-medium"
                >
                  {parte}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Sin aciertos
            </span>
          )}
          <span
            className={
              'text-base font-extrabold tabular-nums min-w-[2.5rem] text-right ' +
              (gano ? 'text-emerald-600' : 'text-slate-400')
            }
          >
            {gano ? `+${r.puntos}` : '0'}
          </span>
        </div>
      </div>
    </div>
  );
}

function TablaGrupo({ tabla }) {
  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
      <h3 className="text-sm font-semibold px-3 py-2 bg-slate-100 text-slate-600">
        Tabla del grupo (en vivo)
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs">
            <th className="text-left px-3 py-1 font-medium">#</th>
            <th className="text-left py-1 font-medium">Equipo</th>
            <th className="px-2 py-1 font-medium">PJ</th>
            <th className="px-2 py-1 font-medium">DG</th>
            <th className="px-2 py-1 font-medium">GF</th>
            <th className="px-2 py-1 font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((fila) => {
            const eq = EQUIPO_POR_CODIGO[fila.eq];
            const colorFila =
              fila.pos <= 2
                ? 'bg-emerald-50'
                : fila.pos === 3
                ? 'bg-amber-50'
                : '';
            return (
              <tr key={fila.eq} className={'border-t ' + colorFila}>
                <td className="px-3 py-2 text-slate-400">{fila.pos}</td>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <Bandera iso={eq.iso} tam={22} />
                    <span className="font-medium">{eq.abrev}</span>
                  </span>
                </td>
                <td className="text-center px-2 py-2">{fila.pj}</td>
                <td className="text-center px-2 py-2">
                  {fila.dg > 0 ? '+' + fila.dg : fila.dg}
                </td>
                <td className="text-center px-2 py-2">{fila.gf}</td>
                <td className="text-center px-2 py-2 font-bold">{fila.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 px-3 py-2">
        🟢 Clasifican (1º y 2º) · 🟡 3º (posible mejor tercero)
      </p>
    </div>
  );
}

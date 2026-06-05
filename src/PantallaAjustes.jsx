import { useState } from "react";
import { CLAVE_ADMIN } from "./admin";

const ZONAS = {
  MX: { etiqueta: "México (UTC−6)" },
  ES: { etiqueta: "España (UTC+2 verano)" },
  BO: { etiqueta: "Bolivia / Sudamérica (UTC−4)" },
};

// Pastilla de puntos reutilizable.
function Pts({ children, tono = "emerald" }) {
  const tonos = {
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-500",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={"inline-flex items-center justify-center rounded-full font-bold text-xs px-2 py-0.5 tabular-nums " + tonos[tono]}>
      {children}
    </span>
  );
}

// Fila "concepto ........ pastilla".
function Regla({ children, pts, tono }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-slate-600 leading-snug">{children}</span>
      <Pts tono={tono}>{pts}</Pts>
    </div>
  );
}

export default function PantallaAjustes({ zona, onCambioZona, onAbrirAdmin }) {
  return (
    <main className="p-4 max-w-md mx-auto pb-24 space-y-4">
      <h2 className="text-base font-semibold text-slate-700 mt-2">Ajustes</h2>

      {/* Zona horaria */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Zona horaria</h3>
        <p className="text-xs text-slate-400 mb-3">
          Las fechas y horas de los partidos se muestran en esta zona.
        </p>
        <select
          value={zona}
          onChange={(e) => onCambioZona(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
        >
          {Object.entries(ZONAS).map(([k, v]) => (
            <option key={k} value={k}>{v.etiqueta}</option>
          ))}
        </select>
      </section>

      {/* Acordeón: cómo funciona */}
      <Acordeon titulo="¿Cómo funciona la quiniela?" icono="📋">
        <div className="space-y-4">
          {/* Aviso de plazo, destacado */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
            <p className="text-sm font-semibold text-amber-800 mb-1">⏰ Lo más importante</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Completa <strong>los 72 partidos de la fase de grupos antes de que empiece
              el primer partido del Mundial</strong>. En cuanto el organizador cierre las
              predicciones, ya <strong>no podrás editar nada</strong>. Si dejas partidos
              sin marcador, tu bracket no se arma y pierdes esos puntos.
            </p>
          </div>

          <Paso n="1" titulo="Predice la fase de grupos">
            Pon el marcador que crees para los <strong>72 partidos</strong> de grupos. La
            tabla de cada grupo se actualiza en vivo mientras escribes.
          </Paso>
          <Paso n="2" titulo="Tu bracket se arma solo">
            Con tus marcadores, la app ordena cada grupo (1º y 2º) y calcula los{" "}
            <strong>8 mejores terceros</strong> con los criterios oficiales de la FIFA
            (incluido el Anexo C). Si dos equipos quedan empatados en todo, tú decides el
            orden por fair play.
          </Paso>
          <Paso n="3" titulo="Predice las eliminatorias">
            Desde Dieciseisavos hasta la Final, eliges el marcador de cada partido. Si
            predices empate, indicas quién avanza: la <strong>prórroga y los penales no
            dan ni quitan puntos</strong>, solo deciden quién pasa en tu bracket.
          </Paso>
          <Paso n="4" titulo="Premios individuales">
            Eliges goleador, mejor jugador, etc. El organizador los adjudica al terminar
            el Mundial.
          </Paso>
          <Paso n="5" titulo="Sumas puntos en vivo">
            Conforme se juega el Mundial, tus aciertos suman y verás tu lugar en la tabla
            de posiciones <strong>en tiempo real</strong>.
          </Paso>
        </div>
      </Acordeon>

      {/* Acordeón: cómo se puntúa */}
      <Acordeon titulo="Cómo se puntúa" icono="🎯">
        <div className="space-y-4">
          {/* Fase de grupos */}
          <BloqueRegla titulo="Fase de grupos" subtitulo="Por cada partido" maximo="6 pts">
            <Regla pts="+3">Aciertas el ganador <em>o</em> el empate</Regla>
            <Regla pts="+1">
              Aciertas la <strong>diferencia de goles</strong> (mismo margen y mismo ganador).
              Un empate también cuenta.
            </Regla>
            <Regla pts="+2">Marcador <strong>exacto</strong></Regla>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Ej.: predices 1-0 y queda 2-1 → +3 (ganador) y +1 (diferencia) = 4. Si
              aciertas el marcador exacto te llevas los tres = 6.
            </p>
          </BloqueRegla>

          {/* Eliminatorias */}
          <BloqueRegla titulo="Eliminatorias" subtitulo="Por colocación en el bracket">
            <p className="text-[11px] text-slate-500 leading-snug mb-2">
              No puntúas por adivinar el resultado, sino por colocar a cada equipo en el
              bracket real:
            </p>
            <ul className="space-y-1.5 mb-3">
              <li className="text-[11px] text-slate-600 leading-snug">
                <strong>Casilla correcta</strong> — pusiste al equipo justo en su sitio.
              </li>
              <li className="text-[11px] text-slate-600 leading-snug">
                <strong>Llegó a la ronda</strong> — acertaste que llega, pero en otra casilla.
              </li>
              <li className="text-[11px] text-slate-600 leading-snug">
                <strong>Marcador exacto (+2)</strong> y <strong>diferencia de goles (+1)</strong> —
                solo si colocaste a los <strong>dos</strong> equipos de ese partido real.
                Cuenta el tiempo reglamentario; prórroga y penales no.
              </li>
            </ul>
            <TablaRondas
              filas={[
                ["Dieciseisavos", "5", "2", "13"],
                ["Octavos", "7", "3", "17"],
                ["Cuartos", "9", "4", "21"],
                ["Semifinales", "12", "6", "27"],
              ]}
            />
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-2">
              <Regla pts="13 c/u" tono="emerald">
                <strong>3er puesto</strong> — por cada equipo que acierta que juega ese partido
              </Regla>
              <Regla pts="+3">3er puesto — aciertas quién lo gana</Regla>
              <Regla pts="15 c/u" tono="emerald">
                <strong>Final</strong> — por cada finalista acertado
              </Regla>
              <Regla pts="+10">Final — aciertas al <strong>campeón</strong></Regla>
              <p className="text-[11px] text-slate-400 leading-snug">
                En 3er puesto y Final también aplican el exacto (+2) y la diferencia (+1) si
                colocaste a ambos equipos. Máximos: 3er puesto 32 pts · Final 43 pts.
              </p>
            </div>
          </BloqueRegla>

          {/* Premios */}
          <BloqueRegla titulo="Premios individuales" subtitulo="Los adjudica el organizador">
            <Regla pts="+5">Bota de Oro (goleador)</Regla>
            <Regla pts="+5">Balón de Oro (mejor jugador)</Regla>
            <Regla pts="+3">Máximo asistidor</Regla>
            <Regla pts="+3">Mejor jugador joven</Regla>
          </BloqueRegla>
        </div>
      </Acordeon>

      {/* Acceso administrador */}
      <AccesoAdmin onAbrirAdmin={onAbrirAdmin} />

      <p className="text-center text-xs text-slate-300">Quiniela Mundial 2026</p>
    </main>
  );
}

// Paso numerado para "Cómo funciona".
function Paso({ n, titulo, children }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-700 leading-tight">{titulo}</p>
        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{children}</p>
      </div>
    </div>
  );
}

// Tarjeta de un bloque de reglas con cabecera.
function BloqueRegla({ titulo, subtitulo, maximo, children }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700 leading-tight">{titulo}</p>
          {subtitulo && <p className="text-[11px] text-slate-400">{subtitulo}</p>}
        </div>
        {maximo && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
            máx. {maximo}
          </span>
        )}
      </div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}

// Tabla compacta de rondas: nombre | correcta | llegó | máximo.
function TablaRondas({ filas }) {
  return (
    <div className="rounded-lg border border-slate-100 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        <span>Ronda</span>
        <span className="text-center w-12">Correcta</span>
        <span className="text-center w-10">Llegó</span>
        <span className="text-center w-10">Máx.</span>
      </div>
      {filas.map(([ronda, correcta, llego, max]) => (
        <div key={ronda} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-2 py-1.5 border-t border-slate-100 items-center">
          <span className="text-xs text-slate-600">{ronda}</span>
          <span className="text-center w-12"><Pts>{correcta}</Pts></span>
          <span className="text-center w-10"><Pts tono="slate">{llego}</Pts></span>
          <span className="text-center w-10 text-[11px] font-semibold text-slate-400">{max}</span>
        </div>
      ))}
      <p className="text-[10px] text-slate-400 px-2 py-1.5 border-t border-slate-100">
        Todas suman además +2 por marcador exacto y +1 por diferencia (si colocaste a ambos equipos).
      </p>
    </div>
  );
}

// Sección plegable reutilizable.
function Acordeon({ titulo, icono, children }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          {icono && <span>{icono}</span>}
          {titulo}
        </span>
        <span className={"text-slate-400 transition-transform " + (abierto ? "rotate-180" : "")}>
          ▾
        </span>
      </button>
      {abierto && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

function AccesoAdmin({ onAbrirAdmin }) {
  const [abierto, setAbierto] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  function entrar() {
    if (clave === CLAVE_ADMIN) {
      setError("");
      setClave("");
      setAbierto(false);
      onAbrirAdmin();
    } else {
      setError("Contraseña incorrecta.");
    }
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="text-sm text-slate-500 font-medium"
        >
          🔒 Acceso administrador
        </button>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            🔒 Acceso administrador
          </h3>
          <div className="flex gap-2">
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
              placeholder="Contraseña"
              className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={entrar}
              className="bg-emerald-600 text-white font-semibold rounded-lg px-4"
            >
              Entrar
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
      )}
    </section>
  );
}
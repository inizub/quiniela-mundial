import { useState } from "react";
import { CLAVE_ADMIN } from "./admin";

const ZONAS = {
  MX: { etiqueta: "México (UTC−6)" },
  ES: { etiqueta: "España (UTC+2 verano)" },
  BO: { etiqueta: "Bolivia / Sudamérica (UTC−4)" },
};

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
      <Acordeon titulo="¿Cómo funciona la quiniela?">
        <div className="text-sm text-slate-600 space-y-2">
          <p>
            Al inicio predices el <strong>marcador de los 72 partidos</strong> de la
            fase de grupos. Con esos resultados, la app arma <strong>tu bracket</strong>{" "}
            automáticamente: ordena cada grupo (1º, 2º) y calcula los 8 mejores
            terceros aplicando los criterios oficiales de la FIFA.
          </p>
          <p>
            Después predices las <strong>rondas eliminatorias</strong> (Dieciseisavos
            hasta la Final), eligiendo el marcador de cada partido. Si predices un
            empate, eliges quién avanza (prórroga o penales no afectan tus puntos).
          </p>
          <p>
            También eliges tus <strong>premios individuales</strong> (goleador, mejor
            jugador, etc.).
          </p>
          <p>
            Cuando el organizador <strong>cierre las predicciones</strong>, ya no se
            podrán editar. A medida que se juega el Mundial, irás sumando puntos según
            tus aciertos, y verás tu posición en la tabla <strong>en tiempo real</strong>.
          </p>
          <p className="text-xs text-slate-400">
            Consejo: completa los 72 partidos de grupos para desbloquear tu bracket.
          </p>
        </div>
      </Acordeon>

      {/* Acordeón: cómo se puntúa */}
      <Acordeon titulo="Cómo se puntúa">
        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Fase de grupos (por partido)</p>
            <ul className="space-y-0.5 text-xs">
              <li>• Acertar el ganador o el empate: <strong>3 pts</strong></li>
              <li>• Marcador exacto: <strong>+2 pts</strong></li>
              <li className="text-slate-400">Máximo 5 pts por partido.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-700 mb-1">Eliminatorias (por colocación)</p>
            <p className="text-xs mb-2 text-slate-400">
              No se puntúa por adivinar el resultado del partido, sino por colocar
              correctamente a cada equipo en su casilla del bracket real:
            </p>
            <ul className="space-y-0.5 text-xs mb-2">
              <li>• <strong>Casilla correcta</strong>: pusiste al equipo en su sitio exacto.</li>
              <li>• <strong>Llegó a la ronda</strong>: acertaste que llega, pero en otra casilla.</li>
              <li>• <strong>Marcador exacto (+2)</strong>: solo si colocaste a los dos equipos del partido real (cuenta el tiempo reglamentario; prórroga y penales no).</li>
            </ul>
            <ul className="space-y-0.5 text-xs">
              <li>• Dieciseisavos: correcta <strong>5</strong> / llegó <strong>2</strong> / exacto <strong>+2</strong></li>
              <li>• Octavos: correcta <strong>7</strong> / llegó <strong>3</strong> / exacto <strong>+2</strong></li>
              <li>• Cuartos: correcta <strong>9</strong> / llegó <strong>4</strong> / exacto <strong>+2</strong></li>
              <li>• Semifinales: correcta <strong>12</strong> / llegó <strong>6</strong> / exacto <strong>+2</strong></li>
              <li>• 3er puesto: cada equipo <strong>13</strong> / exacto <strong>+2</strong> / acertar quién gana <strong>+3</strong></li>
              <li>• Final: cada finalista <strong>15</strong> / exacto <strong>+2</strong> / acertar al campeón <strong>+10</strong></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-700 mb-1">Premios individuales</p>
            <ul className="space-y-0.5 text-xs">
              <li>• Bota de Oro (goleador): <strong>5 pts</strong></li>
              <li>• Balón de Oro (mejor jugador): <strong>5 pts</strong></li>
              <li>• Máximo asistidor: <strong>3 pts</strong></li>
              <li>• Mejor jugador joven: <strong>3 pts</strong></li>
            </ul>
            <p className="text-xs text-slate-400 mt-1">
              Los premios los revisa y adjudica el organizador al final del torneo.
            </p>
          </div>
        </div>
      </Acordeon>

      {/* Acceso administrador */}
      <AccesoAdmin onAbrirAdmin={onAbrirAdmin} />

      <p className="text-center text-xs text-slate-300">Quiniela Mundial 2026</p>
    </main>
  );
}

// Sección plegable reutilizable.
function Acordeon({ titulo, children }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-700">{titulo}</span>
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
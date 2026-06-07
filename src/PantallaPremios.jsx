const PREMIOS = [
  { clave: "botaOro", titulo: "🥇 Bota de Oro", desc: "Máximo goleador del torneo", pts: 5 },
  { clave: "balonOro", titulo: "🏅 Balón de Oro", desc: "Mejor jugador del torneo", pts: 5 },
  { clave: "asistidor", titulo: "🎯 Máximo asistidor", desc: "Jugador con más asistencias", pts: 3 },
  { clave: "joven", titulo: "🌟 Mejor jugador joven", desc: "Mejor jugador sub-21", pts: 3 },
];

export default function PantallaPremios({ premios, onCambio, bloqueado }) {
  function cambiar(clave, valor) {
    onCambio({ ...premios, [clave]: valor });
  }

  return (
    <main className="p-4 max-w-md mx-auto pb-40">
      <h2 className="text-base font-semibold text-slate-700 mb-1 mt-2">
        Premios individuales
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Escribe el <strong>nombre y apellido</strong> del jugador (ej. Kylian Mbappé).
      </p>

      {bloqueado && (
        <div className="mb-3 bg-amber-100 text-amber-800 text-sm rounded-lg px-3 py-2">
          🔒 Las predicciones están cerradas. Ya no se pueden editar.
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
          </div>
        ))}
      </div>
    </main>
  );
}
import { useState, useEffect } from "react";
import { obtenerPosiciones, suscribirCambios } from "./posiciones";

export default function PantallaPosiciones() {
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

  return (
    <main className="p-4 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-700">Tabla de posiciones</h2>
        <span className="text-xs text-emerald-600">
          {actualizando ? "Actualizando…" : "● En vivo"}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs">
              <th className="text-left px-3 py-2 font-medium">#</th>
              <th className="text-left py-2 font-medium">Participante</th>
              <th className="px-3 py-2 font-medium text-center">Predijo</th>
              <th className="px-3 py-2 font-medium text-center">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((fila, i) => (
              <tr key={fila.id} className={"border-t " + (i === 0 ? "bg-amber-50" : "")}>
                <td className="px-3 py-3 text-slate-400">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td className="py-3 font-medium">{fila.nombre}</td>
                <td className="px-3 py-3 text-center text-slate-400 text-xs">
                  {fila.partidosPredichos}/72
                </td>
                <td className="px-3 py-3 text-center font-bold text-emerald-700">
                  {fila.puntos}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tabla.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-6">
            Aún no hay participantes.
          </p>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Suma de fase de grupos, eliminatorias y premios. Se actualiza en tiempo real.
      </p>
    </main>
  );
}
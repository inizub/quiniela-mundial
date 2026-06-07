export default function PantallaBienvenida({ nombre, onEntrar }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-slate-50 via-white to-emerald-50 px-6 py-12">
      <style>{`
        @keyframes splashIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .splash-in { animation: splashIn 0.6s ease-out; }
      `}</style>
      <div className="text-center pt-10">
        <p className="text-xs font-bold tracking-[0.35em] uppercase text-emerald-600">
          Hola de nuevo
        </p>
        <h1 className="text-4xl font-extrabold mt-2 text-slate-900">
          {nombre || "Bienvenido"} 👋
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
      <img src="/portada.png" alt="Mundial 2026" className="w-80 max-w-[90%] mx-auto block splash-in" />
        <div className="text-center">
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">
            Quiniela BCN
          </p>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-emerald-600 mt-1">
            Mundial 2026
          </p>
        </div>
      </div>

      <button
        onClick={onEntrar}
        className="w-full max-w-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg font-bold tracking-wide rounded-2xl py-4 shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-transform"
      >
        ENTRAR
      </button>
    </div>
  );
}
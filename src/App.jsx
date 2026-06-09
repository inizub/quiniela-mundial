import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  buscarParticipantePorToken,
  leerPrediccion,
  guardarPrediccion,
} from "./almacenamiento";
import PantallaBienvenida from "./PantallaBienvenida";
import PantallaPredicciones from "./PantallaPredicciones";
import PantallaPosiciones from "./PantallaPosiciones";
import PantallaBracket from "./PantallaBracket";
import PantallaPremios from "./PantallaPremios";
import PantallaAjustes from "./PantallaAjustes";
import PantallaAdmin from "./PantallaAdmin";

// Lee el token del participante desde la URL (?jugador=TOKEN).
function tokenDeLaUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("jugador");
  } catch {
    return null;
  }
}

export default function App() {
  const [pantalla, setPantalla] = useState("predicciones");
  const [adminAbierto, setAdminAbierto] = useState(false);
  const [entrado, setEntrado] = useState(false);

  const [participante, setParticipante] = useState(null);
  const [abiertas, setAbiertas] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Partes de la predicción
  const [marcadoresGrupos, setMarcadoresGrupos] = useState({});
  const [bracketPred, setBracketPred] = useState({ avances: {}, marcadores: {} });
  const [ordenFairPlay, setOrdenFairPlay] = useState({});
  const [desempateTerceros, setDesempateTerceros] = useState([]);
  const [premios, setPremios] = useState({});
  const [zona, setZona] = useState("MX");

  const [estadoGuardado, setEstadoGuardado] = useState("idle");

  useEffect(() => {
    async function inicializar() {
      try {
        const { data: cfg } = await supabase
          .from("config")
          .select("valor")
          .eq("clave", "predicciones_abiertas")
          .single();
        setAbiertas(cfg?.valor === true);

        const token = tokenDeLaUrl();
        if (token) {
          const p = await buscarParticipantePorToken(token);
          setParticipante(p);
          if (p) {
            const datos = await leerPrediccion(p.id);
            setMarcadoresGrupos(datos.marcadoresGrupos || {});
            setBracketPred(datos.bracket || { avances: {}, marcadores: {} });
            setOrdenFairPlay(datos.ordenFairPlay || {});
            setDesempateTerceros(datos.desempateTerceros || []);
            setPremios(datos.premios || {});
            if (datos.zona) setZona(datos.zona);
          }
        }
      } catch (e) {
        console.error("Error al inicializar:", e);
      } finally {
        setCargando(false);
      }
    }
    inicializar();
  }, []);

  // Escucha en vivo el candado de predicciones: si el admin cierra, a todos
  // se les bloquea al instante sin necesidad de recargar.
  useEffect(() => {
    const canal = supabase
      .channel("candado-predicciones")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "config" },
        (payload) => {
          const fila = payload.new;
          if (fila && fila.clave === "predicciones_abiertas") {
            setAbiertas(fila.valor === true);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const bloqueado = abiertas === false;
  const haySesion = !!participante; // tiene link válido

  // Si no hay sesión y está en una pantalla personal, lo mandamos a posiciones.
  useEffect(() => {
    if (!cargando && !haySesion &&
        (pantalla === "predicciones" || pantalla === "bracket" || pantalla === "premios")) {
      setPantalla("posiciones");
    }
  }, [cargando, haySesion, pantalla]);

  async function guardarTodo() {
    if (!participante) return;
    setEstadoGuardado("guardando");
    const res = await guardarPrediccion(participante.id, {
      marcadoresGrupos,
      bracket: bracketPred,
      ordenFairPlay,
      desempateTerceros,
      premios,
      zona,
    });
    if (res === "cerrado") {
      setAbiertas(false);
      setEstadoGuardado("cerrado");
    } else {
      setEstadoGuardado(res ? "guardado" : "error");
    }
  }
  function alCambiarGrupos(nuevos) { setMarcadoresGrupos(nuevos); setEstadoGuardado("idle"); }
  function alCambiarBracket(nuevo) { setBracketPred(nuevo); setEstadoGuardado("idle"); }
  function alCambiarFairPlay(nuevo) { setOrdenFairPlay(nuevo); setEstadoGuardado("idle"); }
  function alCambiarDesempateTerceros(nuevo) { setDesempateTerceros(nuevo); setEstadoGuardado("idle"); }
  function alCambiarPremios(nuevo) { setPremios(nuevo); setEstadoGuardado("idle"); }

  async function alCambiarZona(nuevaZona) {
    setZona(nuevaZona);
    if (participante) {
      await guardarPrediccion(participante.id, {
        marcadoresGrupos, bracket: bracketPred, ordenFairPlay, desempateTerceros, premios, zona: nuevaZona,
      });
    }
  }

  if (cargando)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Cargando…
      </div>
    );

  // Pantalla de bienvenida (splash) antes de entrar a la app.
  if (!entrado) {
    return (
      <PantallaBienvenida
        nombre={participante ? participante.nombre : null}
        onEntrar={() => setEntrado(true)}
      />
    );
  }

  // Panel de admin a pantalla completa.
  if (adminAbierto) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 text-slate-900">
        <header className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 text-white px-4 py-3 shadow-lg sticky top-0 z-20 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-wide text-emerald-50" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>⚙️ Administración</h1>
          <button
            onClick={() => setAdminAbierto(false)}
            className="text-sm bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 font-medium"
          >
            Salir
          </button>
        </header>
        <PantallaAdmin />
      </div>
    );
  }

  const mostrarBarraGuardado =
    haySesion &&
    !bloqueado &&
    (pantalla === "predicciones" || pantalla === "bracket" || pantalla === "premios");

  // Pantalla mostrada para quien no tiene link (pestañas personales bloqueadas).
  function PantallaSinLink() {
    return (
      <main className="p-4 max-w-md mx-auto pb-24">
        <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6 text-center">
          <p className="text-4xl mb-3">🔑</p>
          <p className="font-semibold text-slate-700 mb-1">Necesitas tu link personal</p>
          <p className="text-sm text-slate-500">
            Para hacer tus predicciones, entra con el link que te compartió el
            organizador. Mientras tanto, puedes ver la tabla de posiciones.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.22s ease-out; }
        @keyframes pop {
          0%   { opacity: 0; transform: scale(0.8); }
          60%  { opacity: 1; transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .pop-in { animation: pop 0.3s ease-out; }
      `}</style>

      <header className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 text-white px-4 py-3 shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="leading-tight">
        <h1 className="text-xl font-semibold tracking-wide text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Quiniela <span className="text-emerald-100">BCN</span>
            </h1>
            <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-emerald-100/80 mt-0.5">
              Mundial 2026
            </p>
          </div>
          <span className="text-xs font-semibold bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            {participante ? participante.nombre : "Invitado"}
          </span>
        </div>
      </header>

      <div key={pantalla} className="fade-in">
        {pantalla === "predicciones" && (
          haySesion ? (
            <PantallaPredicciones
              marcadores={marcadoresGrupos}
              onCambio={alCambiarGrupos}
              ordenFairPlay={ordenFairPlay}
              onCambioFairPlay={alCambiarFairPlay}
              zona={zona}
              bloqueado={bloqueado}
            />
          ) : <PantallaSinLink />
        )}
        {pantalla === "bracket" && (
          haySesion ? (
            <PantallaBracket
              marcadoresGrupos={marcadoresGrupos}
              bracketPred={bracketPred}
              ordenFairPlay={ordenFairPlay}
              desempateTerceros={desempateTerceros}
              onCambio={alCambiarBracket}
              onCambioDesempateTerceros={alCambiarDesempateTerceros}
              bloqueado={bloqueado}
            />
          ) : <PantallaSinLink />
        )}
        {pantalla === "premios" && (
          haySesion ? (
            <PantallaPremios
              premios={premios}
              onCambio={alCambiarPremios}
              bloqueado={bloqueado}
            />
          ) : <PantallaSinLink />
        )}
       {pantalla === "posiciones" && <PantallaPosiciones miId={participante?.id} bloqueado={bloqueado} />}
        {pantalla === "ajustes" && (
          <PantallaAjustes
            zona={zona}
            onCambioZona={alCambiarZona}
            onAbrirAdmin={() => setAdminAbierto(true)}
          />
        )}
      </div>

      {mostrarBarraGuardado && (
        <div className="fixed bottom-16 inset-x-0 bg-white border-t px-4 py-3 z-20">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button
              onClick={guardarTodo}
              disabled={estadoGuardado === "guardando"}
              className="flex-1 bg-emerald-600 text-white font-semibold rounded-lg py-3 disabled:opacity-60 active:scale-[0.99] transition-transform"
            >
              {estadoGuardado === "guardando" ? "Guardando…" : "Guardar predicción"}
            </button>
            {estadoGuardado === "guardado" && (
              <span className="text-emerald-600 text-sm font-medium pop-in">✅ Guardado</span>
            )}
            {estadoGuardado === "cerrado" && (
              <span className="text-red-600 text-sm font-medium pop-in">🔒 Predicciones cerradas</span>
            )}
            {estadoGuardado === "error" && (
              <span className="text-red-600 text-sm font-medium pop-in">⚠️ Error</span>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t flex z-30">
        <BotonMenu activo={pantalla === "predicciones"} onClick={() => setPantalla("predicciones")} icono="✏️" texto="Predicciones" />
        <BotonMenu activo={pantalla === "bracket"} onClick={() => setPantalla("bracket")} icono="🏟️" texto="Bracket" />
        <BotonMenu activo={pantalla === "premios"} onClick={() => setPantalla("premios")} icono="🥇" texto="Premios" />
        <BotonMenu activo={pantalla === "posiciones"} onClick={() => setPantalla("posiciones")} icono="🏆" texto="Posiciones" />
        <BotonMenu activo={pantalla === "ajustes"} onClick={() => setPantalla("ajustes")} icono="⚙️" texto="Ajustes" />
      </nav>
    </div>
  );
}

function BotonMenu({ activo, onClick, icono, texto }) {
  return (
    <button
      onClick={onClick}
      className={
        "relative flex-1 py-2.5 text-center font-medium transition-all duration-150 active:scale-95 " +
        (activo ? "text-emerald-600" : "text-slate-400")
      }
    >
      {activo && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-emerald-600" />
      )}
      <div className="text-lg leading-none">{icono}</div>
      <div className="text-[10px] mt-0.5">{texto}</div>
    </button>
  );
}
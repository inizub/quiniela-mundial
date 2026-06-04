// ============================================================
// BRACKET REAL — Lo que pasó de verdad en el Mundial.
// Reusa el MISMO motor probado que arma el bracket de cada participante.
// A partir de los resultados reales de grupos (que mete el admin), arma el
// Round de 32 real; luego propaga los marcadores reales de cada eliminatoria.
// ============================================================
import { construirRound32, resolverBracketCompleto } from "./motorBracket";

// Construye el bracket real completo.
// resultadosGrupos: { "G-A1": {local,visita}, ... }  (resultados REALES de grupos)
// marcadoresElim:   { "M73": {local,visita}, ... }   (marcadores reales de eliminatorias, tiempo regl.)
// avancesElim:      { "M73": 0|1, ... }               (en empates, quién avanzó realmente; lo decide el admin)
// correccionesR32:  { "M74": ["E1","C3"], ... }       (anulación de emergencia: sobreescribe casillas del R32)
//
// Devuelve:
//  - r32: { Mxx: [equipoA, equipoB] }    Round de 32 real
//  - rondas: cada ronda con sus equipos reales ya resueltos
//  - win/lose: ganadores y perdedores por partido
//  - base: info de clasificación (mejores terceros, etc.)
export function construirBracketReal(
  resultadosGrupos,
  marcadoresElim = {},
  avancesElim = {},
  correccionesR32 = {}
) {
  // 1) Round de 32 real con el motor probado (clasificación + Anexo C)
  const base = construirRound32(resultadosGrupos);
  const r32 = {};
  for (const m in base.r32) r32[m] = [...base.r32[m]];

  // 2) Anulación de emergencia: si el admin corrigió alguna casilla, se aplica.
  for (const m in correccionesR32) {
    if (correccionesR32[m]) r32[m] = [...correccionesR32[m]];
  }

  // 3) Determinar el avance de cada partido según el marcador real.
  //    Si hay empate en reglamentario, se usa la decisión del admin (avancesElim).
  const avances = {};
  const todosLosPartidos = [
    ...Object.keys(r32),
    "M89","M90","M91","M92","M93","M94","M95","M96",
    "M97","M98","M99","M100","M101","M102","M103","M104",
  ];
  for (const m of todosLosPartidos) {
    const mc = marcadoresElim[m];
    if (!mc || mc.local === "" || mc.visita === "" || mc.local == null || mc.visita == null) {
      continue; // sin marcador real aún
    }
    const l = Number(mc.local), v = Number(mc.visita);
    if (l > v) avances[m] = 0;
    else if (v > l) avances[m] = 1;
    else if (avancesElim[m] != null) avances[m] = avancesElim[m]; // empate -> decisión admin
    // si empate y sin decisión, queda sin avance (no propaga)
  }

  // 4) Propagar por todo el árbol con el motor probado.
  const resuelto = resolverBracketCompleto(r32, avances);

  return {
    r32,
    rondas: resuelto.rondas,
    win: resuelto.win,
    lose: resuelto.lose,
    base,
  };
}

// Convierte un bracket resuelto (rondas con equipos) al formato que necesita
// el motor de puntaje de eliminatorias: { rondas, marcadores, campeonIdx, terceroGanaIdx }.
// "resuelto" viene de resolverBracketCompleto o construirBracketReal (tiene .rondas).
// "marcadores" son los marcadores de cada partido. "avances" indica quién ganó (idx).
export function prepararParaPuntaje(resuelto, marcadores, avances) {
  // Índice del campeón: en la final (M104), quién ganó.
  const campeonIdx = avances?.M104 != null ? avances.M104 : null;
  // Índice del que gana el 3er lugar (M103).
  const terceroGanaIdx = avances?.M103 != null ? avances.M103 : null;

  return {
    rondas: {
      R32: resuelto.rondas.R32 || {},
      R16: resuelto.rondas.R16 || {},
      CUARTOS: resuelto.rondas.CUARTOS || {},
      SEMIS: resuelto.rondas.SEMIS || {},
      TERCER_LUGAR: resuelto.rondas.TERCER_LUGAR || {},
      FINAL: resuelto.rondas.FINAL || {},
    },
    marcadores: marcadores || {},
    campeonIdx,
    terceroGanaIdx,
  };
}
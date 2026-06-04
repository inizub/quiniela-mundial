// ============================================================
// MOTOR DEL BRACKET — Arma el árbol de eliminatorias de un participante
// a partir de sus marcadores de fase de grupos.
// Verificado con pruebas (ver pruebasBracket.js).
//
// Pasos:
//  1) Clasifica cada grupo (1º, 2º, 3º) con desempates Art. 13.
//  2) Elige los 8 mejores terceros (Art. 13 sección terceros).
//  3) Aplica el Anexo C para colocar cada tercero en su casilla del R32.
//  4) Devuelve la estructura del R32 con equipos colocados.
//
// ordenFairPlay (opcional): { "A": ["A3","A1"], ... } orden elegido por el
// usuario para los empates que solo se resuelven por fair play.
// ============================================================
import { GRUPOS, LETRAS_GRUPOS } from "../datos/equipos";
import { partidosDeGrupo } from "../datos/partidos";
import { calcularTabla } from "./clasificacion";
import { ANEXO_C } from "../datos/anexoC";
import { R32, COLUMNA_A_PARTIDO } from "../datos/cruces";
import { R16, CUARTOS, SEMIS, TERCER_LUGAR, FINAL } from "../datos/cruces";

// Devuelve la clasificación de los 12 grupos y la lista de terceros con stats.
function clasificarTodosLosGrupos(marcadores, ordenFairPlay = {}) {
  const primeros = {};
  const segundos = {};
  const tercerosPorGrupo = {};
  const tercerosConStats = [];

  for (const L of LETRAS_GRUPOS) {
    const equipos = GRUPOS[L].map((e) => e.codigo);
    const partidos = partidosDeGrupo(L);
    const ordenGrupo = ordenFairPlay[L] || null;
    const tabla = calcularTabla(equipos, partidos, marcadores, {}, ordenGrupo);

    primeros[`1${L}`] = tabla[0].eq;
    segundos[`2${L}`] = tabla[1].eq;
    tercerosPorGrupo[`3${L}`] = tabla[2].eq;
    tercerosConStats.push({
      grupo: L,
      eq: tabla[2].eq,
      pts: tabla[2].pts,
      dg: tabla[2].dg,
      gf: tabla[2].gf,
    });
  }
  return { primeros, segundos, tercerosPorGrupo, tercerosConStats };
}

// Ordena los 12 terceros y devuelve los 8 mejores (Art. 13 sección terceros).
function elegirMejoresTerceros(tercerosConStats) {
  const ordenados = [...tercerosConStats].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dg - a.dg ||
      b.gf - a.gf ||
      a.grupo.localeCompare(b.grupo)
  );
  return ordenados.slice(0, 8);
}

// Construye el Round de 32 (equipos colocados) a partir de los marcadores.
export function construirRound32(marcadores, ordenFairPlay = {}) {
  const { primeros, segundos, tercerosPorGrupo, tercerosConStats } =
    clasificarTodosLosGrupos(marcadores, ordenFairPlay);

  const mejores8 = elegirMejoresTerceros(tercerosConStats);
  const gruposClasifican = mejores8.map((t) => t.grupo).sort().join("");
  const patron = ANEXO_C[gruposClasifican];

  const slotAEquipo = { ...primeros, ...segundos, ...tercerosPorGrupo };

  const r32 = {};
  for (const m in R32) r32[m] = [...R32[m]];

  if (patron) {
    for (const columna in COLUMNA_A_PARTIDO) {
      const partido = COLUMNA_A_PARTIDO[columna];
      const tercero3X = patron[columna];
      r32[partido][1] = tercero3X;
    }
  }

  const r32Equipos = {};
  for (const m in r32) {
    r32Equipos[m] = r32[m].map((slot) => slotAEquipo[slot] || slot);
  }

  return {
    r32: r32Equipos,
    r32Slots: r32,
    primeros,
    segundos,
    tercerosPorGrupo,
    mejores8,
    gruposClasifican,
    patron,
    hayPatron: !!patron,
  };
}

// Resuelve el bracket completo a partir del R32 (equipos colocados) y los avances.
export function resolverBracketCompleto(r32Equipos, avances) {
  const win = {};
  const lose = {};
  const val = (slot) =>
    slot in win ? win[slot] : slot in lose ? lose[slot] : slot;

  function procesa(cruces, yaEquipos = false) {
    const salida = {};
    for (const m in cruces) {
      const equipos = yaEquipos ? cruces[m] : cruces[m].map(val);
      salida[m] = equipos;
      const idx = avances[m];
      if (equipos[0] == null || equipos[1] == null || idx == null) continue;
      win[`W${m.slice(1)}`] = equipos[idx];
      lose[`L${m.slice(1)}`] = equipos[idx === 0 ? 1 : 0];
    }
    return salida;
  }

  const rondas = {
    R32: procesa(r32Equipos, true),
    R16: procesa(R16),
    CUARTOS: procesa(CUARTOS),
    SEMIS: procesa(SEMIS),
    TERCER_LUGAR: procesa(TERCER_LUGAR),
    FINAL: procesa(FINAL),
  };

  return { win, lose, rondas };
}

// Detecta grupos donde hay equipos empatados que solo se resolverían por fair play.
export function detectarEmpatesFairPlay(resultados) {
  const avisos = [];
  for (const L of LETRAS_GRUPOS) {
    const equipos = GRUPOS[L].map((e) => e.codigo);
    const partidos = partidosDeGrupo(L);
    const tabla = calcularTabla(equipos, partidos, resultados);

    for (let i = 0; i < tabla.length; i++) {
      const grupo = [tabla[i]];
      for (let j = i + 1; j < tabla.length; j++) {
        if (
          tabla[j].pts === tabla[i].pts &&
          tabla[j].dg === tabla[i].dg &&
          tabla[j].gf === tabla[i].gf
        ) {
          grupo.push(tabla[j]);
        } else break;
      }
      if (grupo.length > 1) {
        avisos.push({ grupo: L, equipos: grupo.map((f) => f.eq) });
        i += grupo.length - 1;
      }
    }
  }
  return avisos;
}
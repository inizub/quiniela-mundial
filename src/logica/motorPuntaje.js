// ============================================================
// MOTOR DE PUNTAJE — Fase de grupos + Premios + Eliminatorias
// Lógica separada y probada. Reglamento confirmado contra el PDF.
// ============================================================

import { EQUIPO_POR_CODIGO } from "../datos/equipos";

function signo(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}

// ---------- FASE DE GRUPOS ----------

export function puntosPartidoGrupo(prediccion, real) {
  if (!prediccion || !real)
    return { puntos: 0, motivo: "Sin datos", acertoResultado: false, exacto: false };

  const pl = prediccion.local, pv = prediccion.visita;
  const rl = real.local, rv = real.visita;

  if (pl === "" || pv === "" || pl == null || pv == null)
    return { puntos: 0, motivo: "Sin predicción", acertoResultado: false, exacto: false };
  if (rl === "" || rv === "" || rl == null || rv == null)
    return { puntos: 0, motivo: "Sin resultado", acertoResultado: false, exacto: false };

  const PL = Number(pl), PV = Number(pv), RL = Number(rl), RV = Number(rv);
  const acertoResultado = signo(PL, PV) === signo(RL, RV);
  const exacto = PL === RL && PV === RV;

  let puntos = 0;
  let motivo = "No acertado (0)";
  if (acertoResultado) {
    puntos = 3;
    motivo = signo(RL, RV) === 0 ? "Empate acertado (+3)" : "Ganador acertado (+3)";
    if (exacto) {
      puntos += 2;
      motivo += " · Marcador exacto (+2)";
    }
  }
  return { puntos, motivo, acertoResultado, exacto };
}

export function puntosGruposParticipante(predicciones, resultados, partidos) {
  let total = 0;
  const desglose = {};
  for (const p of partidos) {
    const real = resultados[p.id];
    if (!real || real.local == null || real.visita == null) continue;
    const r = puntosPartidoGrupo(predicciones[p.id], real);
    desglose[p.id] = r;
    total += r.puntos;
  }
  return { total, desglose };
}

// Puntos de premios por ADJUDICACIÓN MANUAL del admin.
// adjudicaciones: { botaOro: [idParticipante,...], balonOro:[...], asistidor:[...], joven:[...] }
// Devuelve { total, desglose } para un participante concreto.
const PUNTOS_PREMIOS = { botaOro: 5, balonOro: 5, asistidor: 3, joven: 3 };

export function puntosPremios(participanteId, adjudicaciones) {
  if (!adjudicaciones || !participanteId) return { total: 0, desglose: {} };
  let total = 0;
  const desglose = {};
  for (const premio in PUNTOS_PREMIOS) {
    const lista = adjudicaciones[premio] || [];
    if (lista.includes(participanteId)) {
      desglose[premio] = PUNTOS_PREMIOS[premio];
      total += PUNTOS_PREMIOS[premio];
    }
  }
  return { total, desglose };
}

// ---------- ELIMINATORIAS ----------

const PUNTOS_ELIM = {
  R32:     { correcta: 5,  incorrecta: 2, exacto: 2 },
  R16:     { correcta: 7,  incorrecta: 3, exacto: 2 },
  CUARTOS: { correcta: 9,  incorrecta: 4, exacto: 2 },
  SEMIS:   { correcta: 12, incorrecta: 6, exacto: 2 },
};

// Traduce un código de equipo (A2) a su abreviatura (RSA) para los textos.
function nombreEquipo(codigo) {
  const eq = EQUIPO_POR_CODIGO[codigo];
  return eq ? eq.abrev : codigo;
}

// Un "equipo" válido es un código real (A1, B2...), no un slot sin resolver (W89, L101, 3rd).
function esEquipoReal(e) {
  if (!e) return false;
  const s = String(e);
  return !s.startsWith("W") && !s.startsWith("L") && s !== "3rd";
}

function puntosRondaNormal(clave, predRonda, realRonda, predMarc, realMarc) {
  const cfg = PUNTOS_ELIM[clave];
  const equiposReales = new Set();
  for (const m in realRonda) for (const e of realRonda[m]) if (esEquipoReal(e)) equiposReales.add(e);
  const casillaRealDe = {};
  for (const m in realRonda)
    realRonda[m].forEach((e, i) => { if (e) casillaRealDe[e] = m + "#" + i; });
  const colocadosUser = new Set();
  for (const m in predRonda) for (const e of predRonda[m]) if (e) colocadosUser.add(e);

  let total = 0;
  const detalle = {};
  for (const m in predRonda) {
    let pts = 0;
    const motivos = [];
    const eqs = predRonda[m] || [];
    eqs.forEach((eq, idx) => {
      if (!esEquipoReal(eq)) return;
      if (!equiposReales.has(eq)) return;
      const nombre = nombreEquipo(eq);
      if (casillaRealDe[eq] === m + "#" + idx) {
        pts += cfg.correcta;
        motivos.push(nombre + ": casilla correcta (+" + cfg.correcta + ")");
      } else {
        pts += cfg.incorrecta;
        motivos.push(nombre + ": llegó a la ronda (+" + cfg.incorrecta + ")");
      }
    });
    const realDeEste = realRonda[m] || [];
    const ambos = realDeEste.length === 2 && realDeEste.every((e) => e && colocadosUser.has(e));
    if (ambos && predMarc[m] && realMarc[m]) {
      const pm = predMarc[m], rm = realMarc[m];
      if (pm.local != null && pm.visita != null && rm.local != null && rm.visita != null &&
          pm.local !== "" && rm.local !== "") {
        if (Number(pm.local) === Number(rm.local) && Number(pm.visita) === Number(rm.visita)) {
          pts += cfg.exacto;
          motivos.push("Marcador exacto (+" + cfg.exacto + ")");
        }
      }
    }
    total += pts;
    detalle[m] = { pts, motivos };
  }
  return { total, detalle };
}

function puntos3erLugar(pred, real, predMarc, realMarc, predGanaIdx, realGanaIdx) {
  const realSet = new Set((real || []).filter(Boolean));
  let pts = 0;
  const motivos = [];
  for (const e of pred || []) if (e && realSet.has(e)) { pts += 13; motivos.push(nombreEquipo(e) + ": jugó el 3er lugar (+13)"); }
  const ambos = (pred || []).length === 2 && pred.every((e) => e && realSet.has(e));
  if (ambos && predMarc && realMarc && predMarc.local != null && realMarc.local != null &&
      predMarc.local !== "" && realMarc.local !== "") {
    if (Number(predMarc.local) === Number(realMarc.local) && Number(predMarc.visita) === Number(realMarc.visita)) {
      pts += 2; motivos.push("Marcador exacto (+2)");
    }
  }
  if (predGanaIdx != null && realGanaIdx != null && pred[predGanaIdx] && pred[predGanaIdx] === real[realGanaIdx]) {
    pts += 3; motivos.push("Acertó quién gana el 3er lugar (+3)");
  }
  return { pts, motivos };
}

function puntosFinalPartido(pred, real, predMarc, realMarc, predCampIdx, realCampIdx) {
  const realSet = new Set((real || []).filter(Boolean));
  let pts = 0;
  const motivos = [];
  for (const e of pred || []) if (e && realSet.has(e)) { pts += 15; motivos.push(nombreEquipo(e) + ": jugó la final (+15)"); }
  const ambos = (pred || []).length === 2 && pred.every((e) => e && realSet.has(e));
  if (ambos && predMarc && realMarc && predMarc.local != null && realMarc.local != null &&
      predMarc.local !== "" && realMarc.local !== "") {
    if (Number(predMarc.local) === Number(realMarc.local) && Number(predMarc.visita) === Number(realMarc.visita)) {
      pts += 2; motivos.push("Marcador exacto (+2)");
    }
  }
  if (predCampIdx != null && realCampIdx != null && pred[predCampIdx] && pred[predCampIdx] === real[realCampIdx]) {
    pts += 10; motivos.push("¡Acertó al CAMPEÓN! (+10)");
  }
  return { pts, motivos };
}

export function puntosEliminatorias(predBracket, realBracket) {
  let total = 0;
  const desglose = {};
  if (!predBracket || !realBracket) return { total: 0, desglose: {} };

  for (const clave of ["R32", "R16", "CUARTOS", "SEMIS"]) {
    const pr = (predBracket.rondas && predBracket.rondas[clave]) || {};
    const re = (realBracket.rondas && realBracket.rondas[clave]) || {};
    const r = puntosRondaNormal(clave, pr, re, predBracket.marcadores || {}, realBracket.marcadores || {});
    total += r.total;
    Object.assign(desglose, r.detalle);
  }

  const pred3 = predBracket.rondas && predBracket.rondas.TERCER_LUGAR && predBracket.rondas.TERCER_LUGAR.M103;
  const real3 = realBracket.rondas && realBracket.rondas.TERCER_LUGAR && realBracket.rondas.TERCER_LUGAR.M103;
  if (pred3 && real3) {
    const t = puntos3erLugar(pred3, real3, (predBracket.marcadores || {}).M103,
      (realBracket.marcadores || {}).M103, predBracket.terceroGanaIdx, realBracket.terceroGanaIdx);
    total += t.pts;
    desglose.M103 = t;
  }

  const predF = predBracket.rondas && predBracket.rondas.FINAL && predBracket.rondas.FINAL.M104;
  const realF = realBracket.rondas && realBracket.rondas.FINAL && realBracket.rondas.FINAL.M104;
  if (predF && realF) {
    const fn = puntosFinalPartido(predF, realF, (predBracket.marcadores || {}).M104,
      (realBracket.marcadores || {}).M104, predBracket.campeonIdx, realBracket.campeonIdx);
    total += fn.pts;
    desglose.M104 = fn;
  }

  return { total, desglose };
}

// ---------- TOTAL GENERAL ----------

// Total general de un participante: grupos + premios (manual).
// (Las eliminatorias se suman aparte en posiciones.js porque necesitan el bracket real.)
export function puntosTotales(predicciones, resultados, partidos, adjudicacionesPremios, participanteId) {
  const grupos = puntosGruposParticipante(
    predicciones.marcadoresGrupos || {},
    resultados,
    partidos
  );
  const premios = puntosPremios(participanteId, adjudicacionesPremios);
  return {
    total: grupos.total + premios.total,
    grupos: grupos.total,
    premios: premios.total,
    desgloseGrupos: grupos.desglose,
    desglosePremios: premios.desglose,
  };
}
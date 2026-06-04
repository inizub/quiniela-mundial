// ============================================================
// TABLA DE POSICIONES GENERAL + TIEMPO REAL
// Puntos totales = grupos + premios (adjudicados manualmente) + eliminatorias.
// ============================================================
import { supabase } from "./supabaseClient";
import { PARTIDOS_GRUPOS } from "./datos/partidos";
import { puntosTotales, puntosEliminatorias } from "./logica/motorPuntaje";
import { construirRound32, resolverBracketCompleto } from "./logica/motorBracket";
import { construirBracketReal, prepararParaPuntaje } from "./logica/bracketReal";

// Cuenta cuántos partidos de grupos tienen marcador completo.
function contarPartidosPredichos(datos) {
  const marcadores = datos?.marcadoresGrupos || {};
  let n = 0;
  for (const id in marcadores) {
    const m = marcadores[id];
    if (m && m.local !== "" && m.visita !== "" && m.local != null && m.visita != null) n++;
  }
  return n;
}

// Lee resultados reales de grupos, premios adjudicados y el bracket real.
async function leerDatosReales() {
  const { data: res } = await supabase
    .from("resultados")
    .select("partido_id, goles_local, goles_visita");
  const resultados = {};
  for (const r of res || []) {
    resultados[r.partido_id] = { local: r.goles_local, visita: r.goles_visita };
  }

  let premiosAdjudicados = {};
  const { data: cfgP } = await supabase
    .from("config").select("valor").eq("clave", "premios_adjudicados").maybeSingle();
  if (cfgP?.valor) premiosAdjudicados = cfgP.valor;

  let bracketReal = null;
  const { data: cfgB } = await supabase
    .from("config").select("valor").eq("clave", "bracket_real").maybeSingle();
  if (cfgB?.valor) bracketReal = cfgB.valor;

  return { resultados, premiosAdjudicados, bracketReal };
}

export async function obtenerPosiciones() {
  const { data: participantes, error: errP } = await supabase
    .from("participantes")
    .select("id, nombre")
    .eq("activo", true);
  if (errP) {
    console.error("Error al leer participantes:", errP);
    return [];
  }

  const { data: predicciones, error: errPr } = await supabase
    .from("predicciones")
    .select("participante_id, datos");
  if (errPr) {
    console.error("Error al leer predicciones:", errPr);
    return [];
  }

  const { resultados, premiosAdjudicados, bracketReal } = await leerDatosReales();

  // Si hay bracket real (admin metió los 72 grupos), preparamos el bracket real
  // una sola vez para reusarlo con todos los participantes.
  let realParaPuntaje = null;
  const hayBracketReal = Object.keys(resultados).length === 72 && bracketReal;
  if (hayBracketReal) {
    const real = construirBracketReal(
      resultados,
      bracketReal.marcadoresElim || {},
      bracketReal.avancesElim || {},
      bracketReal.correccionesR32 || {}
    );
    realParaPuntaje = prepararParaPuntaje(real, bracketReal.marcadoresElim || {}, bracketReal.avancesElim || {});
  }

  const porId = {};
  for (const pr of predicciones) porId[pr.participante_id] = pr.datos;

  const tabla = participantes.map((p) => {
    const datos = porId[p.id] || {};

    // Grupos + premios (los premios se adjudican manualmente por el admin)
    const calc = puntosTotales(datos, resultados, PARTIDOS_GRUPOS, premiosAdjudicados, p.id);
    let puntosElim = 0;

    // Eliminatorias (solo si hay bracket real y el participante tiene bracket)
    if (hayBracketReal && datos.bracket) {
      const base = construirRound32(datos.marcadoresGrupos || {}, datos.ordenFairPlay || {});
      const resuelto = resolverBracketCompleto(base.r32, datos.bracket.avances || {});
      const predParaPuntaje = prepararParaPuntaje(
        resuelto, datos.bracket.marcadores || {}, datos.bracket.avances || {}
      );
      const ce = puntosEliminatorias(predParaPuntaje, realParaPuntaje);
      puntosElim = ce.total;
    }

    return {
      id: p.id,
      nombre: p.nombre,
      puntos: calc.total + puntosElim,
      puntosGrupos: calc.grupos,
      puntosPremios: calc.premios,
      puntosElim,
      partidosPredichos: contarPartidosPredichos(datos),
    };
  });

  tabla.sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
  return tabla;
}

export function suscribirCambios(alCambiar) {
  const canal = supabase
    .channel("cambios-posiciones")
    .on("postgres_changes", { event: "*", schema: "public", table: "predicciones" }, () => alCambiar())
    .on("postgres_changes", { event: "*", schema: "public", table: "participantes" }, () => alCambiar())
    .on("postgres_changes", { event: "*", schema: "public", table: "resultados" }, () => alCambiar())
    .on("postgres_changes", { event: "*", schema: "public", table: "config" }, () => alCambiar())
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}
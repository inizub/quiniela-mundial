// ============================================================
// CÁLCULO DE LA TABLA DE UN GRUPO + DESEMPATES (Art. 13 FIFA)
// Lógica separada de la interfaz. Probada con casos automatizados.
//
// Orden de desempate aplicado:
//  Paso 1 (solo enfrentamientos directos entre los empatados):
//     a) puntos directos  b) dif. goles directos  c) goles a favor directos
//  Paso 2 (todos los partidos del grupo):
//     d) dif. goles total  e) goles a favor total  f) fair play*
//  Paso 3:
//     g) ranking FIFA reciente  h) ranking FIFA anterior*
//  * fair play y ranking se SALTAN sin romperse si no hay datos.
//
// Cuando dos o más equipos empatan en TODO lo calculable (el "empate duro"),
// se respeta el orden manual elegido por el usuario (ordenFairPlay), si existe.
// ============================================================

// Calcula la tabla ordenada de un grupo.
// equipos:       ["A1","A2","A3","A4"]
// partidos:      [{id, local, visita}, ...]
// resultados:    { "G-A1": {local:"2", visita:"1"}, ... }
// rankingFIFA:   { "A1": 5, ... }  (opcional; menor número = mejor)
// ordenFairPlay: ["A3","A1",...]  (opcional; orden elegido por el usuario para
//                los equipos empatados en todo)
export function calcularTabla(
  equipos,
  partidos,
  resultados,
  rankingFIFA = {},
  ordenFairPlay = null
) {
  // 1) Estadísticas base de cada equipo
  const st = {};
  for (const e of equipos)
    st[e] = { eq: e, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0, dg: 0 };

  const jugados = [];
  for (const p of partidos) {
    const r = resultados[p.id];
    if (!r) continue;
    if (r.local === "" || r.visita === "" || r.local == null || r.visita == null)
      continue;
    const gl = Number(r.local);
    const gv = Number(r.visita);
    if (Number.isNaN(gl) || Number.isNaN(gv)) continue;

    jugados.push({ ...p, gl, gv });
    const L = st[p.local];
    const V = st[p.visita];
    L.pj++; V.pj++;
    L.gf += gl; L.gc += gv;
    V.gf += gv; V.gc += gl;
    if (gl > gv) { L.g++; V.p++; L.pts += 3; }
    else if (gl < gv) { V.g++; L.p++; V.pts += 3; }
    else { L.e++; V.e++; L.pts++; V.pts++; }
  }
  for (const e of equipos) st[e].dg = st[e].gf - st[e].gc;

  // Mini-liga entre un subconjunto (solo sus enfrentamientos directos)
  function directos(grupo) {
    const m = {};
    for (const e of grupo) m[e] = { pts: 0, dg: 0, gf: 0 };
    for (const j of jugados) {
      if (grupo.includes(j.local) && grupo.includes(j.visita)) {
        m[j.local].gf += j.gl; m[j.visita].gf += j.gv;
        m[j.local].dg += j.gl - j.gv; m[j.visita].dg += j.gv - j.gl;
        if (j.gl > j.gv) m[j.local].pts += 3;
        else if (j.gl < j.gv) m[j.visita].pts += 3;
        else { m[j.local].pts++; m[j.visita].pts++; }
      }
    }
    return m;
  }

  // Devuelve <0 si "a" va antes (mejor clasificado) que "b".
  function comparar(a, b, conjuntoEmpatados) {
    // PASO 1: criterios directos entre el conjunto empatado a puntos
    const d = directos(conjuntoEmpatados);
    if (d[a].pts !== d[b].pts) return d[b].pts - d[a].pts;
    if (d[a].dg !== d[b].dg) return d[b].dg - d[a].dg;
    if (d[a].gf !== d[b].gf) return d[b].gf - d[a].gf;
    // PASO 2: criterios sobre todo el grupo
    if (st[a].dg !== st[b].dg) return st[b].dg - st[a].dg;
    if (st[a].gf !== st[b].gf) return st[b].gf - st[a].gf;
    // f) fair play: se salta (no hay datos de tarjetas en la quiniela)
    // PASO 3: ranking FIFA (menor = mejor). Si falta para alguno, se salta.
    const ra = rankingFIFA[a];
    const rb = rankingFIFA[b];
    if (ra != null && rb != null && ra !== rb) return ra - rb;
    // Empate "duro": si el usuario eligió un orden manual (fair play), respetarlo.
    if (ordenFairPlay) {
      const ia = ordenFairPlay.indexOf(a);
      const ib = ordenFairPlay.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
    }
    return 0;
  }

  // Ordenar por puntos y desempatar dentro de cada bloque de igual puntaje
  const orden = [...equipos].sort((a, b) => st[b].pts - st[a].pts);
  const resultado = [];
  let i = 0;
  while (i < orden.length) {
    let j = i;
    while (j < orden.length && st[orden[j]].pts === st[orden[i]].pts) j++;
    const bloque = orden.slice(i, j);
    if (bloque.length === 1) resultado.push(bloque[0]);
    else resultado.push(...[...bloque].sort((a, b) => comparar(a, b, bloque)));
    i = j;
  }

  return resultado.map((e, idx) => ({ pos: idx + 1, ...st[e] }));
}

// Detecta, en un grupo ya calculado, los conjuntos de equipos que quedaron
// empatados en TODO lo calculable (mismos pts, dg y gf) y por tanto solo se
// distinguen por fair play. Devuelve [[códigos empatados], ...].
export function empatesDuros(equipos, partidos, resultados) {
  const tabla = calcularTabla(equipos, partidos, resultados);
  const grupos = [];
  let i = 0;
  while (i < tabla.length) {
    let j = i + 1;
    while (
      j < tabla.length &&
      tabla[j].pts === tabla[i].pts &&
      tabla[j].dg === tabla[i].dg &&
      tabla[j].gf === tabla[i].gf
    ) {
      j++;
    }
    if (j - i > 1) grupos.push(tabla.slice(i, j).map((f) => f.eq));
    i = j;
  }
  return grupos;
}
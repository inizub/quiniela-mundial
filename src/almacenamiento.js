// ============================================================
// GUARDADO Y LECTURA DE PREDICCIONES EN SUPABASE
// Todo el acceso a la base de datos de predicciones vive aquí,
// separado de la interfaz. Cada función maneja sus errores.
// ============================================================
import { supabase } from "./supabaseClient";

// Busca un participante por su token (el código de su link único).
// Devuelve { id, nombre } o null si no existe.
export async function buscarParticipantePorToken(token) {
  const { data, error } = await supabase
    .from("participantes")
    .select("id, nombre, activo")
    .eq("token", token)
    .single();
  if (error) {
    console.error("No se encontró el participante:", error);
    return null;
  }
  // Si está desactivado, su link ya no da acceso.
  if (data && data.activo === false) return null;
  return data;
}

// Lee la predicción guardada de un participante.
// Devuelve el objeto "datos" (o {} si aún no ha guardado nada).
export async function leerPrediccion(participanteId) {
  const { data, error } = await supabase
    .from("predicciones")
    .select("datos")
    .eq("participante_id", participanteId)
    .maybeSingle(); // maybeSingle: no falla si todavía no hay fila
  if (error) {
    console.error("Error al leer la predicción:", error);
    return {};
  }
  return data?.datos || {};
}

// Guarda (crea o actualiza) la predicción de un participante.
// Guarda (crea o actualiza) la predicción de un participante.
// Antes de escribir, comprueba en el servidor que las predicciones sigan
// abiertas. Así, aunque alguien tenga la app abierta desde hace días, no
// puede guardar una vez cerradas.
export async function guardarPrediccion(participanteId, datos) {
  // 1) Verificar el candado EN EL SERVIDOR (no en la pantalla del jugador).
  const { data: cfg, error: errCfg } = await supabase
    .from("config")
    .select("valor")
    .eq("clave", "predicciones_abiertas")
    .maybeSingle();
  if (errCfg) {
    console.error("Error al verificar el estado de predicciones:", errCfg);
    return false;
  }
  if (cfg?.valor !== true) {
    console.warn("Predicciones cerradas: no se guarda.");
    return "cerrado"; // señal para avisar al jugador
  }

  // 2) Guardar.
  const { error } = await supabase.from("predicciones").upsert(
    {
      participante_id: participanteId,
      datos: datos,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "participante_id" }
  );
  if (error) {
    console.error("Error al guardar la predicción:", error);
    return false;
  }
  return true;
}
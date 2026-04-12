import { supabase } from "./client";

export type Frecuencia = "diario" | "semanal" | "mensual";

export interface HabitoDefinicionRow {
  id: string;
  uid: string;
  nombre: string;
  emoji: string;
  frecuencia: Frecuencia;
  hora: string | null;
  lugar: string | null;
  dias_semana: string[];
  dia_mes: number | null;
  activo: boolean;
  created_at: string;
}

export interface HabitoFormData {
  nombre: string;
  emoji: string;
  frecuencia: Frecuencia;
  hora: string | null;
  lugar: string | null;
  dias_semana: string[];
  dia_mes: number | null;
}

export interface HabitoFijoRow {
  id: string;
  uid: string;
  fecha: string;
  tipo: string;
  completado: boolean;
}

export interface HabitoRegistroRow {
  id: string;
  uid: string;
  fecha: string;
  tipo: string;
  ref_id: string;
}

// ─── Definiciones ─────────────────────────────────────────────────────────────

export async function getHabitosDefinicion(uid: string): Promise<HabitoDefinicionRow[]> {
  const { data } = await supabase
    .from("habitos_definicion")
    .select("*")
    .eq("uid", uid)
    .eq("activo", true)
    .order("created_at", { ascending: true });
  return (data ?? []) as HabitoDefinicionRow[];
}

export async function crearHabitoDefinicion(
  uid: string,
  data: HabitoFormData
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("habitos_definicion").insert({
    uid,
    nombre: data.nombre,
    emoji: data.emoji,
    frecuencia: data.frecuencia,
    hora: data.hora || null,
    lugar: data.lugar || null,
    dias_semana: data.dias_semana,
    dia_mes: data.dia_mes,
  });
  return { error: error?.message ?? null };
}

export async function editarHabitoDefinicion(
  id: string,
  data: HabitoFormData
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("habitos_definicion")
    .update({
      nombre: data.nombre,
      emoji: data.emoji,
      frecuencia: data.frecuencia,
      hora: data.hora || null,
      lugar: data.lugar || null,
      dias_semana: data.dias_semana,
      dia_mes: data.dia_mes,
    })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function eliminarHabitoDefinicion(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("habitos_definicion")
    .update({ activo: false })
    .eq("id", id);
  return { error: error?.message ?? null };
}

// ─── Hábitos fijos (predefinidos) ────────────────────────────────────────────

export async function toggleHabitoFijo(
  uid: string,
  fecha: string,
  tipo: string,
  completado: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("habitos")
    .upsert({ uid, fecha, tipo, completado }, { onConflict: "uid,fecha,tipo" });
  return { error: error?.message ?? null };
}

// ─── Registro custom + ejercicios ────────────────────────────────────────────

export async function toggleHabitoRegistro(
  uid: string,
  fecha: string,
  tipo: string,
  refId: string,
  completado: boolean
): Promise<{ error: string | null }> {
  if (completado) {
    const { error } = await supabase
      .from("habitos_registro")
      .upsert({ uid, fecha, tipo, ref_id: refId }, { onConflict: "uid,fecha,tipo,ref_id" });
    return { error: error?.message ?? null };
  } else {
    const { error } = await supabase
      .from("habitos_registro")
      .delete()
      .eq("uid", uid).eq("fecha", fecha).eq("tipo", tipo).eq("ref_id", refId);
    return { error: error?.message ?? null };
  }
}

// ─── Lectura por fecha / semana ───────────────────────────────────────────────

export async function getHabitosFecha(
  uid: string,
  fecha: string
): Promise<{ fijos: HabitoFijoRow[]; registro: HabitoRegistroRow[] }> {
  const [{ data: fijos }, { data: registro }] = await Promise.all([
    supabase.from("habitos").select("*").eq("uid", uid).eq("fecha", fecha),
    supabase.from("habitos_registro").select("*").eq("uid", uid).eq("fecha", fecha),
  ]);
  return {
    fijos: (fijos ?? []) as HabitoFijoRow[],
    registro: (registro ?? []) as HabitoRegistroRow[],
  };
}

export async function getHabitosSemana(
  uid: string,
  desde: string,
  hasta: string
): Promise<{ fijos: HabitoFijoRow[]; registro: HabitoRegistroRow[] }> {
  const [{ data: fijos }, { data: registro }] = await Promise.all([
    supabase.from("habitos").select("*").eq("uid", uid).gte("fecha", desde).lte("fecha", hasta),
    supabase.from("habitos_registro").select("*").eq("uid", uid).gte("fecha", desde).lte("fecha", hasta),
  ]);
  return {
    fijos: (fijos ?? []) as HabitoFijoRow[],
    registro: (registro ?? []) as HabitoRegistroRow[],
  };
}

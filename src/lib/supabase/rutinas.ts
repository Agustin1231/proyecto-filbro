import { supabase } from "./client";

export interface Ejercicio {
  bloque: string;
  nombre: string;
  detalle: string;   // ej: "3 series × 12 repeticiones"
  descanso: number;  // segundos
  descripcion?: string;
}

export interface RutinaContenido {
  texto: string;
  nivel: string;
  tiempo: string;
  lugar: string;
  limitacion: string;
  metricas?: { sueno?: number; estres?: number };
  ejercicios?: Ejercicio[];
}

export interface RutinaRow {
  id: string;
  uid: string;
  nombre: string;
  contenido: RutinaContenido;
  activa: boolean;
  created_at: string;
}

export async function guardarRutina(
  uid: string,
  nombre: string,
  contenido: RutinaContenido
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("rutinas").insert({ uid, nombre, contenido });
  return { error: error?.message ?? null };
}

export async function getRutinasGuardadas(uid: string): Promise<RutinaRow[]> {
  const { data } = await supabase
    .from("rutinas")
    .select("*")
    .eq("uid", uid)
    .eq("activa", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as RutinaRow[];
}

export async function eliminarRutina(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("rutinas")
    .update({ activa: false })
    .eq("id", id);
  return { error: error?.message ?? null };
}

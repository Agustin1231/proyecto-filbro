import { supabase } from "./client";
import type { MetricaType } from "./types";

export interface MetricaRow {
  id:         string;
  uid:        string;
  tipo:       MetricaType;
  valor:      number;
  unidad:     string;
  notas:      string | null;
  created_at: string;
}

/** Guarda o actualiza la métrica de hoy (upsert por día) */
export async function guardarMetrica(
  uid:    string,
  tipo:   MetricaType,
  valor:  number,
  unidad: string,
  notas?: string
): Promise<{ error: string | null }> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  // Buscar si ya existe un registro de este tipo para hoy
  const { data: existente } = await supabase
    .from("metricas")
    .select("id")
    .eq("uid", uid)
    .eq("tipo", tipo)
    .gte("created_at", hoy.toISOString())
    .lt("created_at", manana.toISOString())
    .single();

  if (existente?.id) {
    const { error } = await supabase
      .from("metricas")
      .update({ valor, unidad, notas: notas ?? null })
      .eq("id", existente.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("metricas").insert({
    uid, tipo, valor, unidad, notas: notas ?? null,
  });
  return { error: error?.message ?? null };
}

/** Último registro de cada tipo para un usuario */
export async function getUltimasMetricas(uid: string): Promise<MetricaRow[]> {
  const { data } = await supabase
    .from("metricas")
    .select("*")
    .eq("uid", uid)
    .order("created_at", { ascending: false });

  if (!data) return [];

  // Quedarse solo con el último de cada tipo
  const seen = new Set<string>();
  return data.filter((r) => {
    if (seen.has(r.tipo)) return false;
    seen.add(r.tipo);
    return true;
  }) as MetricaRow[];
}

/** Historial de una métrica para graficar (últimos N días) */
export async function getHistorialMetrica(
  uid:  string,
  tipo: MetricaType,
  dias: number = 30
): Promise<MetricaRow[]> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const { data } = await supabase
    .from("metricas")
    .select("*")
    .eq("uid", uid)
    .eq("tipo", tipo)
    .gte("created_at", desde.toISOString())
    .order("created_at", { ascending: true });

  return (data ?? []) as MetricaRow[];
}

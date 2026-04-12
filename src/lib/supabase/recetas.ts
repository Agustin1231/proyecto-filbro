import { supabase } from "./client";

export interface RecetaRow {
  id: string;
  uid: string;
  titulo: string;
  contenido: string;
  imagen_url: string | null;
  ingredientes: string[];
  created_at: string;
}

export async function guardarReceta(
  uid: string,
  titulo: string,
  contenido: string,
  imagen_url: string | null,
  ingredientes: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("recetas_guardadas").insert({
    uid,
    titulo,
    contenido,
    imagen_url: imagen_url ?? null,
    ingredientes,
  });
  return { error: error?.message ?? null };
}

export async function getRecetasGuardadas(uid: string): Promise<RecetaRow[]> {
  const { data } = await supabase
    .from("recetas_guardadas")
    .select("*")
    .eq("uid", uid)
    .order("created_at", { ascending: false });

  return (data ?? []) as RecetaRow[];
}

export async function eliminarReceta(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("recetas_guardadas")
    .delete()
    .eq("id", id);
  return { error: error?.message ?? null };
}

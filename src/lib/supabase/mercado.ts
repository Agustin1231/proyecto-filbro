import { supabase } from "./client";

export interface ListaMercadoRow {
  id: string;
  uid: string;
  nombre: string;
  periodo: string;
  contenido: string;
  created_at: string;
}

export async function guardarListaMercado(
  uid: string,
  nombre: string,
  periodo: string,
  contenido: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("listas_mercado")
    .insert({ uid, nombre, periodo, contenido });
  return { error: error?.message ?? null };
}

export async function getListasMercado(uid: string): Promise<ListaMercadoRow[]> {
  const { data } = await supabase
    .from("listas_mercado")
    .select("*")
    .eq("uid", uid)
    .order("created_at", { ascending: false });
  return (data ?? []) as ListaMercadoRow[];
}

export async function eliminarListaMercado(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("listas_mercado").delete().eq("id", id);
  return { error: error?.message ?? null };
}

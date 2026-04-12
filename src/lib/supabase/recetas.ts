import { supabase } from "./client";

/**
 * Sube una imagen (data URL base64) al bucket "recetas" de Supabase Storage.
 * Devuelve la URL pública o null si falla.
 * Requiere bucket "recetas" creado con acceso público en Supabase.
 */
export async function uploadRecetaImagen(
  uid: string,
  base64DataUrl: string
): Promise<string | null> {
  try {
    const [prefix, data] = base64DataUrl.split(",");
    if (!prefix || !data) return null;

    const mimeType = prefix.split(":")[1]?.split(";")[0] ?? "image/png";
    const ext = mimeType === "image/jpeg" ? "jpg" : "png";

    // Base64 → Uint8Array
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const path = `${uid}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("recetas-imagenes")
      .upload(path, bytes, { contentType: mimeType, cacheControl: "31536000" });

    if (error) return null;

    const { data: urlData } = supabase.storage.from("recetas-imagenes").getPublicUrl(path);
    return urlData.publicUrl ?? null;
  } catch {
    return null;
  }
}

export interface RecetaRow {
  id: string;
  uid: string;
  titulo: string;
  contenido: string;
  imagen_url: string | null;
  ingredientes: string[];
  calificacion: number | null;
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

export async function calificarReceta(id: string, calificacion: number): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("recetas_guardadas")
    .update({ calificacion })
    .eq("id", id);
  return { error: error?.message ?? null };
}

import { GoogleGenAI } from "@google/genai";
import { uploadRecetaImagen } from "@/lib/supabase/recetas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { titulo, descripcion, uid } = await req.json();

  if (!titulo) {
    return Response.json({ error: "Título requerido" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key no configurada" }, { status: 500 });
  }

  try {
    console.log("[imagen] Iniciando generación para:", titulo);
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Professional food photography of "${titulo}". ${
      descripcion ?? "Healthy cardiovascular dish, Mediterranean style"
    }. Shot from above, natural lighting, rustic wooden table, vibrant colors, appetizing, high resolution.`;

    console.log("[imagen] Llamando a Imagen 3...");
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt,
      config: { numberOfImages: 1 },
    });
    console.log("[imagen] Respuesta recibida de Imagen 3");

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;

    if (!imageBytes) {
      console.error("[imagen] imageBytes vacío, respuesta completa:", JSON.stringify(response));
      return Response.json({ error: "No se pudo generar la imagen", detalle: "imageBytes vacío" }, { status: 500 });
    }

    console.log("[imagen] imageBytes OK, tamaño:", imageBytes.length);
    const base64DataUrl = `data:image/png;base64,${imageBytes}`;

    // Subir a Supabase Storage si hay uid
    if (uid) {
      console.log("[imagen] Subiendo a Supabase Storage, uid:", uid);
      const publicUrl = await uploadRecetaImagen(uid, base64DataUrl);
      console.log("[imagen] URL pública:", publicUrl);
      if (publicUrl) {
        return Response.json({ imagen: publicUrl });
      }
      console.warn("[imagen] Upload a Supabase falló, usando fallback base64");
    }

    // Fallback: devolver base64 si no hay uid o falló el upload
    return Response.json({ imagen: base64DataUrl });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("Error generando imagen:", err);
    return Response.json({ error: "Error al generar imagen", detalle: mensaje, stack }, { status: 500 });
  }
}

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
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Professional food photography of "${titulo}". ${
      descripcion ?? "Healthy cardiovascular dish, Mediterranean style"
    }. Shot from above, natural lighting, rustic wooden table, vibrant colors, appetizing, high resolution.`;

    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt,
      config: { numberOfImages: 1 },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;

    if (!imageBytes) {
      return Response.json({ error: "No se pudo generar la imagen" }, { status: 500 });
    }

    const base64DataUrl = `data:image/png;base64,${imageBytes}`;

    // Subir a Supabase Storage si hay uid
    if (uid) {
      const publicUrl = await uploadRecetaImagen(uid, base64DataUrl);
      if (publicUrl) {
        return Response.json({ imagen: publicUrl });
      }
    }

    // Fallback: devolver base64 si no hay uid o falló el upload
    return Response.json({ imagen: base64DataUrl });
  } catch (err) {
    console.error("Error generando imagen:", err);
    return Response.json({ error: "Error al generar imagen" }, { status: 500 });
  }
}

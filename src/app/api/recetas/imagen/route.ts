import { GoogleGenAI, Modality } from "@google/genai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { titulo, descripcion } = await req.json();

  if (!titulo) {
    return Response.json({ error: "Título requerido" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key no configurada" }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Professional food photography of "${titulo}". ${descripcion ?? "Healthy cardiovascular dish, Mediterranean style"}. Shot from above, natural lighting, on a rustic wooden table, vibrant colors, appetizing presentation, high resolution.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p) => p.inlineData);

    if (!imagePart?.inlineData?.data) {
      return Response.json({ error: "No se pudo generar la imagen" }, { status: 500 });
    }

    const mimeType = imagePart.inlineData.mimeType ?? "image/png";
    const imageBase64 = imagePart.inlineData.data;

    return Response.json({
      imagen: `data:${mimeType};base64,${imageBase64}`,
    });
  } catch (err) {
    console.error("Error generando imagen:", err);
    return Response.json({ error: "Error al generar imagen" }, { status: 500 });
  }
}

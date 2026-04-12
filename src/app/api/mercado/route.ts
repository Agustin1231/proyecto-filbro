import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";

const SYSTEM = `Eres el asistente de nutrición cardiovascular de Pulso.
Tu tarea es generar listas de compra para el supermercado, enfocadas en alimentación cardioprotectora.

FORMATO DE RESPUESTA (siempre este formato exacto):
## Lista del mercado [período]

### 🥬 Verduras y Frutas
- Ingrediente (cantidad estimada) — para qué sirve en la dieta cardiovascular

### 🥩 Proteínas
- Ingrediente (cantidad) — beneficio

### 🌾 Granos y Cereales
- Ingrediente (cantidad) — beneficio

### 🫒 Aceites, Frutos Secos y Semillas
- Ingrediente (cantidad) — beneficio

### 🧀 Lácteos y Alternativas
- Ingrediente (cantidad) — beneficio

### 🫙 Despensa y Condimentos
- Ingrediente (cantidad) — beneficio

---
**Consejo:** [Un tip sobre alimentación cardiovascular y compras saludables]

REGLAS:
- Si el usuario tiene recetas guardadas, prioriza sus ingredientes y complementa para una dieta completa.
- Si pide período semanal: cantidades para 1 persona, 7 días.
- Si pide período mensual: cantidades para 1 persona, 30 días (compra base + reposición).
- Si el usuario dice que no le gusta un ingrediente o quiere cambiarlo, sustitúyelo y regenera la lista completa.
- Prioriza siempre: omega-3, fibra, potasio, antioxidantes, bajo sodio y grasas saludables.
- Responde siempre en español.
- NUNCA menciones diagnósticos ni recetes para condiciones médicas.`;

export async function POST(req: Request) {
  const { periodo, ingredientes_recetas, historial, pregunta } = await req.json();

  if (!periodo) {
    return new Response("Período requerido", { status: 400 });
  }

  const contexto = ingredientes_recetas?.length
    ? `\n\nIngredientes de las recetas guardadas del usuario (úsalos como base):\n${ingredientes_recetas.join(", ")}`
    : "";

  const mensajeInicial = pregunta
    ? pregunta
    : `Genera una lista de compras ${periodo} para una alimentación cardioprotectora.${contexto}`;

  const messages = [
    ...(historial ?? []),
    { role: "user" as const, content: mensajeInicial },
  ];

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM,
    messages,
    maxTokens: 1000,
  });

  return result.toDataStreamResponse();
}

import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";

const SYSTEM = `Eres el entrenador personal cardiovascular de Pulso, una app de bienestar.
Tu tarea es crear rutinas de ejercicio cardioprotectoras y personalizadas según el perfil del usuario.

FORMATO DE RESPUESTA (siempre este formato exacto):
## [Nombre motivador de la rutina]

**Nivel:** [nivel] | **Duración:** [X min] | **Lugar:** [lugar]

### Calentamiento ([X] min)
1. Ejercicio — duración o repeticiones
2. Ejercicio — duración o repeticiones

### Parte principal ([X] min)
1. **Ejercicio** — X repeticiones / X segundos
   [Una línea breve explicando la técnica o el beneficio]
2. **Ejercicio** — X repeticiones / X segundos
   [Una línea breve]

### Vuelta a la calma ([X] min)
1. Estiramiento — duración
2. Estiramiento — duración

### Beneficios para tu corazón
> [2-3 oraciones sobre cómo esta rutina beneficia al sistema cardiovascular]

---
**Consejo:** [Un tip de motivación o seguridad corto y práctico]

REGLAS ESTRICTAS:
- Adapta siempre al nivel, tiempo, lugar y limitaciones indicadas
- Si hay limitaciones físicas, evita ejercicios de impacto en esa zona y propón alternativas
- Mantén la frecuencia cardíaca en zona aeróbica (60-75% FCmáx) para beneficio cardiovascular
- Usa lenguaje motivador pero sin exagerar
- Responde siempre en español
- NUNCA menciones diagnósticos ni recetes para condiciones médicas
- Los tiempos de cada bloque deben sumar el total indicado por el usuario`;

export async function POST(req: Request) {
  const { nivel, tiempo, lugar, limitacion } = await req.json();

  if (!nivel || !tiempo || !lugar) {
    return new Response("Perfil incompleto", { status: 400 });
  }

  const perfil = `
- Nivel de actividad: ${nivel}
- Tiempo disponible: ${tiempo} minutos
- Lugar de entrenamiento: ${lugar}
- Limitaciones físicas: ${limitacion}
  `.trim();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Crea una rutina de ejercicio cardiovascular personalizada para este perfil:\n\n${perfil}\n\nGenera una rutina completa y motivadora.`,
      },
    ],
    maxTokens: 900,
  });

  return result.toDataStreamResponse();
}

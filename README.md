# Pulso — Tu corazón, tus hábitos, tu vida.

App PWA de salud cardiovascular potenciada por IA. Monitorea tus métricas, descubre recetas cardioprotectoras, genera rutinas personalizadas y construye hábitos saludables — sin cuenta, sin datos personales.

---

## Estado del proyecto

| # | Módulo | Estado | Detalles |
|---|--------|--------|----------|
| 1 | Dashboard de Métricas | ✅ Completo | 4 métricas, gráficas 30d, análisis IA, edición inline, upsert diario |
| 2 | Asistente de Recetas + Mercado | ✅ Completo | Streaming Claude, imagen Imagen 3, guardado, calificación estrellas, lista de compras con checklist |
| 3 | Generador de Rutinas | ✅ Completo | Cuestionario conversacional, rutina semanal progresiva, guía paso a paso con timer |
| 4 | Calendario de Hábitos | 🚧 Pendiente | — |
| 5 | Score de Riesgo Cardiovascular | 🚧 Pendiente | — |
| 6 | Centro de Tips Personalizados | 🚧 Pendiente | — |

---

## Módulo 1 — Dashboard de Métricas

Registro y seguimiento de 4 métricas cardiovasculares:

| Métrica | Rango normal |
|---------|-------------|
| Frecuencia cardíaca | 60–100 bpm |
| Peso | — |
| Horas de sueño | 7–9 h (input h + min) |
| Nivel de estrés | 1–3 /10 |

- Tarjetas con estado Normal / Atención / Riesgo
- Edición inline tocando el ícono de lápiz en cada tarjeta
- Gráfica de tendencia 30 días (Recharts)
- Análisis personalizado con Claude en streaming

> Presión arterial removida del MVP por complejidad de interpretación para el usuario general.

---

## Módulo 2 — Asistente de Recetas + Mercado

**Tab Recetas:**
1. Usuario escribe ingredientes disponibles
2. Claude genera receta cardioprotectora en streaming (typewriter word-by-word)
3. Al terminar el texto, Imagen 3 genera foto fotorrealista del plato (~5s)
4. La receta se puede guardar con imagen en Supabase Storage
5. Vista "Guardadas" con detalle full-screen (createPortal) y botón regresar
6. Calificación de estrellas en recetas guardadas

**Tab Mercado:**
- Lista de compras generada con IA extrayendo ingredientes del texto de la receta
- Checklist interactivo para tachar ingredientes mientras se compra
- Contexto histórico de listas anteriores para no repetir ingredientes ya comprados

**Markdown soportado:** `**negrita**`, `*cursiva*`, `---`, `> tips`

---

## Módulo 3 — Generador de Rutinas

1. Cuestionario conversacional con Claude: edad, condición física, tiempo disponible, equipamiento, lesiones, objetivos
2. Genera rutina semanal cardiovascular progresiva (HIIT, cardio moderado, fuerza)
3. Tiene contexto de métricas del usuario e historial de rutinas anteriores para plan progresivo
4. Rutina guiada paso a paso con timer de descanso entre ejercicios

---

## Stack

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | Next.js 15 (App Router) | SSR + PWA + API routes |
| UI | Tailwind CSS 4 + shadcn/ui | Dark mode nativo |
| IA Texto | Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Via Vercel AI SDK, streaming |
| IA Imágenes | Imagen 3 (`imagen-3.0-generate-002`) | Google AI SDK `@google/genai` |
| Base de datos | Supabase (PostgreSQL) | UUID anónimo como PK |
| Storage | Supabase Storage bucket `recetas` | Imágenes de recetas guardadas |
| Gráficas | Recharts | Tendencias de métricas |
| Deploy | Coolify (self-hosted) | Hetzner VPS, CI/CD desde `main` |
| PWA | next-pwa + Web App Manifest | Instalable en iOS y Android |

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

---

## Setup de Supabase Storage

El módulo de recetas requiere un bucket público para guardar imágenes:

1. Ir a **Supabase → Storage → New bucket**
2. Nombre: `recetas`
3. Activar **Public bucket**
4. En **Policies**, crear política que permita `INSERT` y `SELECT` al rol `anon`

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu browser.

---

## Decisiones de diseño

- **Sin login:** UUID anónimo generado en el dispositivo. Sin email, sin contraseña.
- **Dark mode por defecto:** Paleta Obsidian + Coral Pulse.
- **Disclaimer médico obligatorio:** Aparece en onboarding (no skippable) y en módulo de Score.
- **Mobile-first:** Bottom nav en móvil, sidebar en desktop.
- **Modelo de negocio:** Gratis en MVP. Freemium en el futuro.

---

> Pulso es una herramienta de bienestar personal y educación preventiva. La información proporcionada **no constituye diagnóstico médico**. Siempre consultá a un profesional de la salud.

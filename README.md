# Pulso — Tu corazón, tus hábitos, tu vida.

App PWA de salud cardiovascular potenciada por IA. Monitorea tus métricas, descubre recetas cardioprotectoras, genera rutinas personalizadas y construye hábitos saludables — sin cuenta, sin datos personales.

---

## Módulos

| # | Módulo | Estado |
|---|--------|--------|
| 1 | Dashboard de Métricas Cardiovasculares | ✅ Completo |
| 2 | Asistente de Recetas (Claude streaming + Gemini imagen) | ✅ Completo |
| 3 | Generador de Rutinas de Ejercicio | 🚧 En desarrollo |
| 4 | Calendario de Hábitos | 🚧 En desarrollo |
| 5 | Score de Riesgo Cardiovascular | 🚧 En desarrollo |
| 6 | Centro de Tips Personalizados | 🚧 En desarrollo |

---

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS 4 + shadcn/ui
- **IA Texto:** Claude API via Vercel AI SDK (streaming)
- **IA Imágenes:** Gemini API (Google)
- **Base de datos:** Supabase (PostgreSQL)
- **Gráficas:** Recharts
- **Deploy:** Coolify (self-hosted en Hetzner VPS)
- **PWA:** Instalable en iOS y Android sin App Store

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

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
- **Dark mode por defecto:** Paleta Obsidian + Coral Pulse, sin los verdes clichés del sector salud.
- **Disclaimer médico obligatorio:** No se puede saltear en el onboarding. Claude está instruido para no diagnosticar.
- **Mobile-first:** Sidebar en desktop, bottom nav en móvil.

---

> Pulso es una herramienta de bienestar personal y educación preventiva. La información proporcionada **no constituye diagnóstico médico**. Siempre consultá a un profesional de la salud.

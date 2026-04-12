# Pulso — Plan de Producto

> Tu corazón, tus hábitos, tu vida.

App PWA de salud cardiovascular construida con IA. Ayuda a las personas a monitorear sus métricas, mejorar sus hábitos, descubrir recetas saludables y entrenar de forma segura — sin necesidad de cuenta ni datos personales.

---

## Visión

Las enfermedades cardiovasculares son la principal causa de muerte en el mundo. La mayoría de las personas no monitorean sus hábitos ni entienden cómo la dieta, el estrés y el sedentarismo impactan su corazón hasta que ya es tarde.

**Pulso** es una herramienta de bienestar y educación preventiva que combina tracking de métricas, recetas inteligentes, rutinas personalizadas y un calendario de hábitos — todo potenciado por IA para dar análisis y recomendaciones personalizadas.

### Usuario objetivo
- Personas de 25–65 años con interés en su salud
- Personas con factores de riesgo (sedentarismo, sobrepeso, estrés)
- Quienes ya tienen diagnóstico y quieren mejorar hábitos
- Familiares de personas con enfermedades cardiovasculares

---

## Decisiones de Producto

| Tema | Decisión |
|---|---|
| Tipo de app | PWA (instalable desde el browser, sin App Store) |
| Login | Sin login — UUID anónimo generado en el dispositivo |
| Idioma | Español (por ahora) |
| Modelo de negocio | Gratis en MVP — Freemium en el futuro |
| Disclaimers | 100% consumer/bienestar, nunca diagnóstico médico |
| Wearables MVP | Ingreso manual |
| Wearables v2 | Xiaomi Band 10 via Web Bluetooth (Android Chrome) |
| Wearables v3 | Apple Watch via React Native + HealthKit |

### Modelo Freemium (futuro)

**Free**
- Dashboard de métricas — ilimitado
- Calendario de hábitos — ilimitado
- Score de riesgo básico
- Recetas IA — 5 por día
- Rutinas IA — 2 por mes
- Análisis de métricas — semanal

**Premium**
- Todo lo anterior sin límites
- Recetas IA ilimitadas + imagen generada
- Rutinas IA ilimitadas + actualización semanal automática
- Análisis de métricas diario
- Resumen mensual detallado con IA
- Score de riesgo avanzado con proyecciones
- Sincronización wearables (v2)
- Historial ilimitado en la nube

---

## Identidad Visual

**Nombre:** Pulso — del español "pulse/latido", corto, memorable, directamente ligado al corazón.

**Filosofía:** Dark mode por defecto. Premium y moderno. Sin los verdes clichés del sector salud.

### Paleta de colores

| Nombre | Hex | Uso |
|---|---|---|
| Obsidian | `#0D1117` | Fondo principal |
| Coral Pulse | `#FF6B6B` | Color primario / CTA |
| Vital Teal | `#00D4AA` | Métricas positivas |
| Alert Amber | `#F0A500` | Alertas / advertencias |
| Deep Purple | `#A371F7` | IA / funciones premium |
| Vital Blue | `#58A6FF` | Secundario |
| Vital Green | `#3FB950` | Estado normal |
| Snow Text | `#E6EDF3` | Texto principal |

---

## Los 6 Módulos

### 1. Dashboard de Métricas Cardiovasculares ✅
Registro de 4 métricas clave, tarjetas con estado Normal/Atención/Riesgo, edición inline, gráficas de tendencia 30 días y análisis personalizado con Claude en streaming.

**Métricas activas (MVP):**
- Frecuencia cardíaca (bpm) — normal: 60–100
- Peso (kg)
- Horas de sueño — input en horas + minutos, normal: 7–9 h
- Nivel de estrés (1–10) — normal: 1–3

> Presión arterial (sistólica/diastólica) removida del MVP — demasiado técnica para el usuario general sin contexto médico. Se retomará en v2 con contexto educativo mejorado.

### 2. Asistente de Recetas — Streaming + Imagen IA
Chat donde el usuario escribe sus ingredientes. La respuesta llega en tiempo real via streaming (Vercel AI SDK + Claude). Al terminar, se genera automáticamente una imagen fotorrealista del plato con Gemini API. El agente tiene contexto del perfil cardiovascular del usuario.

**Flujo:**
1. Usuario escribe ingredientes
2. Claude responde en streaming con la receta cardioprotectora
3. Al finalizar el texto, Gemini genera la imagen del plato (~3s)
4. La receta se puede guardar con su imagen en Supabase

### 3. Generador de Rutinas de Ejercicio
Cuestionario conversacional con Claude: edad, condición física, tiempo disponible, equipamiento, lesiones, objetivos. Genera una rutina semanal cardiovascular progresiva (HIIT, cardio moderado, fuerza) adaptada al perfil de riesgo. El plan se actualiza según progreso de métricas.

### 4. Calendario de Hábitos
Vistas diaria, semanal y mensual. Registro de ejercicio, alimentación, sueño, medicamentos e hidratación. Heatmap de adherencia (estilo GitHub contributions). Resumen semanal generado por Claude.

### 5. Score de Riesgo Cardiovascular
Score visual 0–100 basado en métricas acumuladas. Desglose por factor con explicación de qué lo eleva. Proyecciones de mejora con cambios concretos. Siempre con disclaimer médico visible.

### 6. Centro de Tips Personalizados
Tips y micro-artículos generados con IA según el perfil del usuario. Contextual: si la presión está alta → tips de sodio; si hay poco sueño → impacto en el corazón; etc.

---

## Stack Tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | Next.js 15 (App Router) | SSR + PWA + API routes |
| UI | Tailwind CSS 4 + shadcn/ui | Dark mode nativo |
| IA Texto | Claude API (`claude-sonnet-4-6`) | Via Vercel AI SDK |
| IA Streaming | Vercel AI SDK | streaming + typewriter word-by-word |
| IA Imágenes | Imagen 3 (`imagen-3.0-generate-002`) | Google AI SDK — imágenes de recetas |
| Base de datos | Supabase (PostgreSQL) | UUID anónimo como PK |
| Gráficas | Recharts | Tendencias de métricas |
| Deploy | Coolify (self-hosted) | Hetzner VPS |
| PWA | next-pwa + Web App Manifest | Instalable en iOS/Android |
| Wearables (v2) | Web Bluetooth API | Xiaomi Band 10 en Android |
| App nativa (v3) | Expo (React Native) | HealthKit + Google Fit |

### Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

---

## Arquitectura de Datos

### Estrategia anónima
1. Primera visita → se genera UUID v4 aleatorio en el browser
2. Se guarda en `localStorage` del dispositivo
3. Todos los datos en Supabase se vinculan solo a ese UUID
4. Sin email, sin nombre, sin datos personales
5. Si el usuario borra la caché → pierde el historial (aceptable en MVP)
6. Futuro: opción de "guardar progreso" vinculando un email al UUID

### Tablas en Supabase
- `metricas` — registros de métricas cardiovasculares
- `habitos` — seguimiento diario de hábitos
- `recetas_guardadas` — recetas con imagen guardadas por el usuario
- `rutinas` — planes de ejercicio generados
- `perfil_usuario` — perfil anónimo del usuario (edad, objetivos, disclaimer aceptado)

---

## Infraestructura

```
Usuario (iOS/Android/Web)
        ↓
   Coolify (Traefik + SSL automático)
        ↓
   Next.js App (Docker container en Hetzner VPS)
        ↓
   ┌─────────────┬──────────────┬─────────────┐
   Supabase    Claude API    Gemini API
   (PostgreSQL)  (Anthropic)   (Google)
```

**CI/CD:** Push a `main` en GitHub → Coolify auto-deploy

---

## Aviso Médico (Disclaimer)

> Pulso es una herramienta de bienestar personal y educación preventiva. La información y análisis proporcionados **no constituyen diagnóstico médico**, consejo clínico ni tratamiento. Siempre consulta a un médico o profesional de la salud certificado antes de tomar decisiones sobre tu salud cardiovascular.

- Aparece obligatorio en el onboarding (no se puede saltar)
- Visible en el módulo de Score
- Claude está instruido para no diagnosticar ni recetar, y recomendar al médico ante síntomas urgentes

---

## Roadmap

### Semana 1–2 — Fundación ✅
- [x] Next.js 15 + Tailwind 4 + shadcn/ui
- [x] Paleta dark mode Pulso
- [x] Layout mobile-first: sidebar (desktop) + bottom nav (móvil)
- [x] Sistema UUID anónimo (localStorage + Supabase)
- [x] Tablas en Supabase
- [x] PWA manifest
- [x] Onboarding con disclaimer médico obligatorio
- [x] Deploy en Coolify con CI/CD automático

### Semana 3–4 — Core de Salud ✅
- [x] Dashboard de métricas (formulario de registro)
- [x] Tarjetas de resumen con estado Normal/Atención/Riesgo
- [x] Gráficas de tendencias 30 días (Recharts)
- [x] Análisis IA con Claude streaming
- [x] API route `/api/analisis-metricas`
- [x] Edición inline de métricas directamente en las tarjetas
- [x] Input de sueño en horas + minutos (ej. 6h 55m)
- [x] Presión arterial removida del MVP

### Semana 5–6 — IA Conversacional ✅ Completo
- [x] Chat de recetas con streaming en tiempo real
- [x] Generación de imagen del plato al terminar (Imagen 3)
- [x] Guardar recetas favoritas con imagen (Supabase Storage)
- [x] Vista de receta completa full-screen con botón regresar (createPortal)
- [x] Calificación de estrellas en recetas guardadas
- [x] Tab Mercado: lista de compras generada por IA con ingredientes de la receta
- [x] Checklist interactivo de mercado con contexto histórico de listas anteriores
- [x] Cuestionario conversacional para rutinas
- [x] Generación de rutina semanal personalizada con contexto de métricas e historial
- [x] Vista de rutina guiada paso a paso con timer de descanso

### Semana 7–8 — Hábitos + Polish + Launch
- [ ] Calendario de hábitos (diario/semanal/mensual)
- [ ] Heatmap de adherencia
- [ ] Resumen semanal generado por Claude
- [ ] Score de riesgo cardiovascular completo
- [ ] Centro de tips personalizados
- [ ] Arquitectura de rate limiting (base para freemium)
- [ ] Pruebas en iOS Safari y Android Chrome como PWA instalada
- [ ] Íconos PWA (icon-192.png, icon-512.png)

### v2 — Wearables y Mejoras
- [ ] Xiaomi Band 10 via Web Bluetooth API (Android Chrome)
- [ ] Notificaciones push para recordatorios
- [ ] Modo offline básico (service worker)
- [ ] Activar sistema freemium con Stripe

### v3 — App Nativa
- [ ] React Native (Expo) con código compartido
- [ ] HealthKit (Apple Watch)
- [ ] Google Fit
- [ ] App Store + Play Store

---

## Equipo

| Quién | Rol |
|---|---|
| Agustín | Product owner, decisiones, testing |
| Claude (Sonnet 4.6) | Desarrollo completo |

---

*Última actualización: 12 de abril de 2026*

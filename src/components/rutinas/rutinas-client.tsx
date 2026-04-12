"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dumbbell, Sparkles, RefreshCw, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── helpers markdown (mismo estilo que recetas/análisis) ────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*"))
          return <em key={i} className="not-italic text-foreground/70">{p.slice(1, -1)}</em>;
        return p;
      })}
    </>
  );
}

function formatearContenido(texto: string): React.ReactNode {
  const lineas = texto.split("\n").filter((l) => !l.match(/^#\s/));
  return lineas.map((linea, i) => {
    if (linea.trim() === "---")
      return <hr key={i} className="border-border/40 my-3" />;
    if (linea.startsWith("> "))
      return (
        <div key={i} className="border-l-2 border-coral/50 bg-coral/5 pl-3 py-1.5 my-2 rounded-r">
          <p className="text-sm text-foreground/75">{renderInline(linea.slice(2))}</p>
        </div>
      );
    if (linea.startsWith("## "))
      return <h2 key={i} className="text-lg font-bold text-foreground mt-4 mb-2 first:mt-0">{linea.slice(3)}</h2>;
    if (linea.startsWith("### "))
      return <h3 key={i} className="text-sm font-semibold text-coral uppercase tracking-widest mt-4 mb-2">{linea.slice(4)}</h3>;
    if (linea.match(/^\*\*.+\*\*$/) && !linea.slice(2, -2).includes("**")) {
      const inner = linea.slice(2, -2);
      if (inner.includes("|")) {
        return (
          <p key={i} className="text-sm text-muted-foreground mb-2 flex gap-3 flex-wrap">
            {inner.split("|").map((c, j) => <span key={j}>{renderInline(c.trim())}</span>)}
          </p>
        );
      }
      return <p key={i} className="text-sm font-semibold text-foreground mb-1">{inner}</p>;
    }
    if (linea.startsWith("- "))
      return (
        <div key={i} className="flex gap-2 text-sm text-foreground/90 mb-1">
          <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
          <span>{renderInline(linea.slice(2))}</span>
        </div>
      );
    if (linea.match(/^\d+\.\s/)) {
      const num = linea.match(/^(\d+)\.\s/)?.[1];
      const content = linea.replace(/^\d+\.\s/, "");
      return (
        <div key={i} className="flex gap-2 text-sm text-foreground/90 mb-1.5">
          <span className="text-coral font-bold shrink-0 min-w-[1.25rem] text-right">{num}.</span>
          <span>{renderInline(content)}</span>
        </div>
      );
    }
    if (linea.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-sm text-foreground/90 mb-1 leading-relaxed">{renderInline(linea)}</p>;
  });
}

// ─── cuestionario ─────────────────────────────────────────────────────────────

const PASOS = [
  {
    id: "nivel",
    pregunta: "¿Cuál es tu nivel de actividad actual?",
    opciones: [
      { valor: "Sedentario (poco o nada de ejercicio)", etiqueta: "Sedentario", desc: "Poco o nada de ejercicio" },
      { valor: "Algo activo (camino regularmente)", etiqueta: "Algo activo", desc: "Camino regularmente" },
      { valor: "Activo (ejercicio 2-3 veces por semana)", etiqueta: "Activo", desc: "2-3 veces por semana" },
    ],
  },
  {
    id: "tiempo",
    pregunta: "¿Cuánto tiempo tienes disponible?",
    opciones: [
      { valor: "15", etiqueta: "15 min", desc: "Sesión rápida" },
      { valor: "30", etiqueta: "30 min", desc: "Sesión estándar" },
      { valor: "45", etiqueta: "45 min", desc: "Sesión completa" },
      { valor: "60", etiqueta: "60 min", desc: "Sesión larga" },
    ],
  },
  {
    id: "lugar",
    pregunta: "¿Dónde vas a entrenar?",
    opciones: [
      { valor: "En casa sin equipamiento", etiqueta: "En casa", desc: "Sin equipamiento" },
      { valor: "Gimnasio con máquinas", etiqueta: "Gimnasio", desc: "Con máquinas" },
      { valor: "Al aire libre", etiqueta: "Al aire libre", desc: "Parque o calle" },
    ],
  },
  {
    id: "limitacion",
    pregunta: "¿Tienes alguna limitación física?",
    opciones: [
      { valor: "Ninguna limitación", etiqueta: "Ninguna", desc: "Sin restricciones" },
      { valor: "Problemas en rodillas o piernas", etiqueta: "Rodillas/piernas", desc: "Evitar impacto" },
      { valor: "Problemas en espalda o lumbar", etiqueta: "Espalda", desc: "Cuidar lumbar" },
      { valor: "Problemas en hombros o brazos", etiqueta: "Hombros/brazos", desc: "Cuidar tren superior" },
    ],
  },
] as const;

type PasoId = (typeof PASOS)[number]["id"];
type Respuestas = Partial<Record<PasoId, string>>;

// ─── componente principal ─────────────────────────────────────────────────────

export function RutinasClient() {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});

  // Generación
  const [estado, setEstado] = useState<"idle" | "streaming" | "completo">("idle");
  const [rutinaTexto, setRutinaTexto] = useState("");
  const [textoMostrado, setTextoMostrado] = useState("");
  const rutinaRef = useRef("");
  const [error, setError] = useState<string | null>(null);

  // ── typewriter ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (textoMostrado.length >= rutinaRef.current.length) return;
    const full = rutinaRef.current;
    const nextSpace = full.indexOf(" ", textoMostrado.length);
    const nextEnd = nextSpace === -1 ? full.length : nextSpace + 1;
    const timer = setTimeout(() => setTextoMostrado(full.slice(0, nextEnd)), 35);
    return () => clearTimeout(timer);
  }, [rutinaTexto, textoMostrado]);

  const escribiendo = textoMostrado.length < rutinaRef.current.length || estado === "streaming";
  const hayContenido = textoMostrado.length > 0;

  // ── seleccionar opción ──────────────────────────────────────────────────────
  const seleccionar = (pasoId: PasoId, valor: string) => {
    const nuevas = { ...respuestas, [pasoId]: valor };
    setRespuestas(nuevas);

    if (paso < PASOS.length - 1) {
      setPaso(paso + 1);
    } else {
      generarRutina(nuevas);
    }
  };

  // ── generar rutina ──────────────────────────────────────────────────────────
  const generarRutina = useCallback(async (r: Respuestas) => {
    setEstado("streaming");
    setRutinaTexto("");
    setTextoMostrado("");
    rutinaRef.current = "";
    setError(null);

    try {
      const res = await fetch("/api/rutinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nivel: r.nivel,
          tiempo: r.tiempo,
          lugar: r.lugar,
          limitacion: r.limitacion,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Error al conectar con el asistente");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let textoCompleto = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const chunk = JSON.parse(line.slice(2));
              if (typeof chunk === "string") {
                textoCompleto += chunk;
                rutinaRef.current = textoCompleto;
                setRutinaTexto(textoCompleto);
              }
            } catch { /* skip */ }
          }
        }
      }

      setEstado("completo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setEstado("idle");
    }
  }, []);

  const resetear = () => {
    setPaso(0);
    setRespuestas({});
    setEstado("idle");
    setRutinaTexto("");
    setTextoMostrado("");
    rutinaRef.current = "";
    setError(null);
  };

  const pasoActual = PASOS[paso];

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Cuestionario ──────────────────────────────────────────────────── */}
      {estado === "idle" && (
        <div className="space-y-4">
          {/* Progreso */}
          <div className="flex items-center gap-2">
            {PASOS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i < paso ? "bg-coral" : i === paso ? "bg-coral/50" : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Paso actual */}
          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-coral uppercase tracking-widest">
                {paso + 1} / {PASOS.length}
              </span>
            </div>
            <p className="text-base font-semibold text-foreground">{pasoActual.pregunta}</p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pasoActual.opciones.map((op) => (
                <button
                  key={op.valor}
                  onClick={() => seleccionar(pasoActual.id, op.valor)}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-all hover:border-coral/40 hover:bg-coral/5 group ${
                    respuestas[pasoActual.id] === op.valor
                      ? "border-coral/50 bg-coral/10"
                      : "border-border bg-surface-2"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{op.etiqueta}</p>
                    <p className="text-xs text-muted-foreground">{op.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-coral transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Resumen de respuestas anteriores */}
          {paso > 0 && (
            <div className="flex flex-wrap gap-2">
              {PASOS.slice(0, paso).map((p) => (
                <span key={p.id} className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-muted-foreground">
                  {p.opciones.find((o) => o.valor === respuestas[p.id])?.etiqueta}
                </span>
              ))}
              <button onClick={resetear} className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-coral hover:border-coral/30 transition-colors">
                Reiniciar
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-coral bg-coral/10 border border-coral/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
      )}

      {/* ── Resultado streaming ────────────────────────────────────────────── */}
      {(estado === "streaming" || estado === "completo") && (
        <div className="space-y-4">
          {/* Chips de perfil seleccionado */}
          <div className="flex flex-wrap gap-2">
            {PASOS.map((p) => (
              <span key={p.id} className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-muted-foreground">
                {p.opciones.find((o) => o.valor === respuestas[p.id])?.etiqueta}
              </span>
            ))}
          </div>

          <div className="rounded-xl border border-coral/25 bg-coral/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-coral/20">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-coral" />
                <span className="text-sm font-bold text-coral">Tu rutina personalizada</span>
              </div>
              {estado === "streaming" && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Generando...</span>
                </div>
              )}
            </div>

            <div className="p-4">
              {hayContenido && (
                <div>
                  {formatearContenido(textoMostrado)}
                  {escribiendo && (
                    <span className="inline-block w-0.5 h-4 bg-coral ml-0.5 animate-blink align-middle" />
                  )}
                </div>
              )}

              {estado === "completo" && !escribiendo && (
                <div className="flex items-center gap-3 pt-3 mt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground flex-1">
                    ⚕️ Orientación educativa — consulta a tu médico antes de iniciar un programa de ejercicio.
                  </p>
                  <button
                    onClick={resetear}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Nueva rutina
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

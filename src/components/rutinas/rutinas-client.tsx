"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dumbbell, Sparkles, RefreshCw, Loader2, ChevronRight,
  Bookmark, BookOpen, Trash2, ArrowLeft, Moon, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnonymousId } from "@/hooks/use-anonymous-id";
import { getUltimasMetricas } from "@/lib/supabase/metricas";
import {
  guardarRutina, getRutinasGuardadas, eliminarRutina,
  type RutinaRow,
} from "@/lib/supabase/rutinas";

// ─── helpers markdown ─────────────────────────────────────────────────────────

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
      if (inner.includes("|"))
        return (
          <p key={i} className="text-sm text-muted-foreground mb-2 flex gap-3 flex-wrap">
            {inner.split("|").map((c, j) => <span key={j}>{renderInline(c.trim())}</span>)}
          </p>
        );
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

function extraerNombre(texto: string): string {
  const match = texto.match(/^##\s+(.+)/m);
  return match?.[1]?.trim() ?? "Rutina cardiovascular";
}

// ─── cuestionario ─────────────────────────────────────────────────────────────

const PASOS = [
  {
    id: "nivel" as const,
    pregunta: "¿Cuál es tu nivel de actividad actual?",
    opciones: [
      { valor: "Sedentario (poco o nada de ejercicio)", etiqueta: "Sedentario", desc: "Poco o nada de ejercicio" },
      { valor: "Algo activo (camino regularmente)", etiqueta: "Algo activo", desc: "Camino regularmente" },
      { valor: "Activo (ejercicio 2-3 veces por semana)", etiqueta: "Activo", desc: "2-3 veces por semana" },
    ],
  },
  {
    id: "tiempo" as const,
    pregunta: "¿Cuánto tiempo tienes disponible?",
    opciones: [
      { valor: "15", etiqueta: "15 min", desc: "Sesión rápida" },
      { valor: "30", etiqueta: "30 min", desc: "Sesión estándar" },
      { valor: "45", etiqueta: "45 min", desc: "Sesión completa" },
      { valor: "60", etiqueta: "60 min", desc: "Sesión larga" },
    ],
  },
  {
    id: "lugar" as const,
    pregunta: "¿Dónde vas a entrenar?",
    opciones: [
      { valor: "En casa sin equipamiento", etiqueta: "En casa", desc: "Sin equipamiento" },
      { valor: "Gimnasio con máquinas", etiqueta: "Gimnasio", desc: "Con máquinas" },
      { valor: "Al aire libre", etiqueta: "Al aire libre", desc: "Parque o calle" },
    ],
  },
  {
    id: "limitacion" as const,
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
type Vista = "nueva" | "guardadas";
type Estado = "idle" | "streaming" | "completo";

// ─── componente principal ─────────────────────────────────────────────────────

export function RutinasClient() {
  const uid = useAnonymousId();
  const [vista, setVista] = useState<Vista>("nueva");

  // Métricas del usuario
  const [sueno, setSueno] = useState<number | undefined>();
  const [estres, setEstres] = useState<number | undefined>();

  // Cuestionario
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});

  // Generación
  const [estado, setEstado] = useState<Estado>("idle");
  const [rutinaTexto, setRutinaTexto] = useState("");
  const [textoMostrado, setTextoMostrado] = useState("");
  const rutinaRef = useRef("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState(false);

  // Historial
  const [guardadas, setGuardadas] = useState<RutinaRow[]>([]);
  const [cargandoGuardadas, setCargandoGuardadas] = useState(false);
  const [rutinaDetalle, setRutinaDetalle] = useState<RutinaRow | null>(null);

  // ── cargar métricas ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    getUltimasMetricas(uid).then((metricas) => {
      const s = metricas.find((m) => m.tipo === "horas_sueno");
      const e = metricas.find((m) => m.tipo === "nivel_estres");
      if (s) setSueno(Number(s.valor));
      if (e) setEstres(Number(e.valor));
    });
  }, [uid]);

  // ── cargar historial ────────────────────────────────────────────────────────
  const cargarGuardadas = useCallback(async () => {
    if (!uid) return;
    setCargandoGuardadas(true);
    setGuardadas(await getRutinasGuardadas(uid));
    setCargandoGuardadas(false);
  }, [uid]);

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
    setGuardada(false);
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
          metricas: { sueno, estres },
          historial_count: guardadas.length,
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
  }, [sueno, estres, guardadas.length]);

  // ── guardar ─────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!uid || !rutinaTexto || guardando || guardada) return;
    setGuardando(true);
    const nombre = extraerNombre(rutinaTexto);
    const { error: err } = await guardarRutina(uid, nombre, {
      texto: rutinaTexto,
      nivel: respuestas.nivel ?? "",
      tiempo: respuestas.tiempo ?? "",
      lugar: respuestas.lugar ?? "",
      limitacion: respuestas.limitacion ?? "",
      metricas: { sueno, estres },
    });
    if (!err) {
      setGuardada(true);
      setGuardadas((prev) => [
        {
          id: Date.now().toString(),
          uid: uid,
          nombre,
          contenido: { texto: rutinaTexto, nivel: respuestas.nivel ?? "", tiempo: respuestas.tiempo ?? "", lugar: respuestas.lugar ?? "", limitacion: respuestas.limitacion ?? "", metricas: { sueno, estres } },
          activa: true,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setGuardando(false);
  };

  const handleEliminar = async (id: string) => {
    await eliminarRutina(id);
    setGuardadas((prev) => prev.filter((r) => r.id !== id));
    if (rutinaDetalle?.id === id) setRutinaDetalle(null);
  };

  const resetear = () => {
    setPaso(0);
    setRespuestas({});
    setEstado("idle");
    setRutinaTexto("");
    setTextoMostrado("");
    rutinaRef.current = "";
    setGuardada(false);
    setError(null);
  };

  // ─── banners de contexto ─────────────────────────────────────────────────────
  const banners: { icon: React.ReactNode; texto: string; color: string }[] = [];
  if (sueno !== undefined && sueno < 7)
    banners.push({ icon: <Moon className="h-3.5 w-3.5" />, texto: `Dormiste ${sueno}h — la rutina será de menor intensidad para que tu cuerpo recupere.`, color: "border-teal/30 bg-teal/5 text-teal" });
  if (estres !== undefined && estres > 5)
    banners.push({ icon: <Brain className="h-3.5 w-3.5" />, texto: `Estrés en ${estres}/10 — incluiremos ejercicios que reducen el cortisol y calman el sistema nervioso.`, color: "border-amber/30 bg-amber/5 text-amber" });

  const semana = Math.floor(guardadas.length / 3) + 1;

  // ─── render ─────────────────────────────────────────────────────────────────

  if (rutinaDetalle) {
    return (
      <RutinaDetalle
        rutina={rutinaDetalle}
        onCerrar={() => setRutinaDetalle(null)}
        onEliminar={() => handleEliminar(rutinaDetalle.id)}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface p-1 border border-border w-fit">
        <button
          onClick={() => setVista("nueva")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            vista === "nueva" ? "bg-coral/15 text-coral border border-coral/30" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Dumbbell className="h-3.5 w-3.5" />
          Nueva rutina
        </button>
        <button
          onClick={() => { setVista("guardadas"); cargarGuardadas(); }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            vista === "guardadas" ? "bg-coral/15 text-coral border border-coral/30" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Mis rutinas
          {guardadas.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-coral/20 text-coral font-bold">{guardadas.length}</span>
          )}
        </button>
      </div>

      {/* ── Nueva rutina ───────────────────────────────────────────────────── */}
      {vista === "nueva" && (
        <div className="space-y-4">

          {/* Banners de contexto de métricas */}
          {estado === "idle" && banners.map((b, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs ${b.color}`}>
              {b.icon}
              <span>{b.texto}</span>
            </div>
          ))}

          {/* Progresión */}
          {estado === "idle" && guardadas.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-coral/10 text-coral border border-coral/20 font-semibold">
                Semana {semana}
              </span>
              <span>{guardadas.length} rutina{guardadas.length !== 1 ? "s" : ""} completada{guardadas.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Cuestionario */}
          {estado === "idle" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {PASOS.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < paso ? "bg-coral" : i === paso ? "bg-coral/50" : "bg-border"}`} />
                ))}
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <span className="text-xs font-semibold text-coral uppercase tracking-widest">
                  {paso + 1} / {PASOS.length}
                </span>
                <p className="text-base font-semibold text-foreground">{PASOS[paso].pregunta}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PASOS[paso].opciones.map((op) => (
                    <button
                      key={op.valor}
                      onClick={() => seleccionar(PASOS[paso].id, op.valor)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3 text-left transition-all hover:border-coral/40 hover:bg-coral/5 group"
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

              {error && <p className="text-xs text-coral bg-coral/10 border border-coral/20 rounded-lg px-3 py-2">{error}</p>}
            </div>
          )}

          {/* Resultado */}
          {(estado === "streaming" || estado === "completo") && (
            <div className="space-y-3">
              {/* Chips del perfil */}
              <div className="flex flex-wrap gap-2">
                {PASOS.map((p) => (
                  <span key={p.id} className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-muted-foreground">
                    {p.opciones.find((o) => o.valor === respuestas[p.id])?.etiqueta}
                  </span>
                ))}
                {sueno !== undefined && sueno < 7 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center gap-1">
                    <Moon className="h-3 w-3" /> {sueno}h sueño
                  </span>
                )}
                {estres !== undefined && estres > 5 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber/10 border border-amber/20 text-amber flex items-center gap-1">
                    <Brain className="h-3 w-3" /> Estrés {estres}/10
                  </span>
                )}
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
                      {escribiendo && <span className="inline-block w-0.5 h-4 bg-coral ml-0.5 animate-blink align-middle" />}
                    </div>
                  )}

                  {estado === "completo" && !escribiendo && (
                    <div className="flex items-center gap-3 pt-3 mt-2 border-t border-border/50">
                      {!guardada ? (
                        <Button
                          onClick={handleGuardar}
                          disabled={guardando || !uid}
                          variant="ghost"
                          className="gap-2 text-coral border border-coral/30 hover:bg-coral/10"
                        >
                          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                          {guardando ? "Guardando..." : "Guardar rutina"}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-coral">
                          <Bookmark className="h-4 w-4 fill-coral" />
                          Rutina guardada
                        </div>
                      )}
                      <button onClick={resetear} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3" /> Nueva rutina
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground px-1">
                ⚕️ Orientación educativa — consulta a tu médico antes de iniciar un programa de ejercicio.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Mis rutinas ────────────────────────────────────────────────────── */}
      {vista === "guardadas" && (
        <div className="space-y-3">
          {cargandoGuardadas ? (
            <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando rutinas...</span>
            </div>
          ) : guardadas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-surface/50 p-10 text-center space-y-2">
              <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">Aún no tienes rutinas guardadas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {guardadas.map((rutina, idx) => {
                const fecha = new Date(rutina.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
                const semanaRutina = Math.floor((guardadas.length - 1 - idx) / 3) + 1;
                return (
                  <button
                    key={rutina.id}
                    onClick={() => setRutinaDetalle(rutina)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left hover:border-coral/30 hover:bg-surface-2 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{rutina.nombre}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-coral/10 text-coral border border-coral/20">
                            Sem. {semanaRutina}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{rutina.contenido.nivel?.split(" ")[0]}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{rutina.contenido.tiempo} min</span>
                          {rutina.contenido.metricas?.sueno !== undefined && rutina.contenido.metricas.sueno < 7 && (
                            <span className="text-[10px] text-teal flex items-center gap-0.5"><Moon className="h-2.5 w-2.5" />{rutina.contenido.metricas.sueno}h</span>
                          )}
                          {rutina.contenido.metricas?.estres !== undefined && rutina.contenido.metricas.estres > 5 && (
                            <span className="text-[10px] text-amber flex items-center gap-0.5"><Brain className="h-2.5 w-2.5" />E:{rutina.contenido.metricas.estres}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{fecha}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEliminar(rutina.id); }}
                          className="text-muted-foreground hover:text-coral transition-colors p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── vista detalle ────────────────────────────────────────────────────────────

function RutinaDetalle({
  rutina,
  onCerrar,
  onEliminar,
}: {
  rutina: RutinaRow;
  onCerrar: () => void;
  onEliminar: () => void;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const fecha = new Date(rutina.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 bg-background animate-slide-in-right overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onCerrar}
            className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-foreground hover:bg-surface-2 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">{rutina.nombre}</h2>
            <p className="text-[10px] text-muted-foreground">{fecha}</p>
          </div>
          <button
            onClick={() => { if (!confirmar) { setConfirmar(true); return; } onEliminar(); }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${confirmar ? "bg-coral/10 border-coral/30 text-coral" : "border-border text-muted-foreground hover:text-coral"}`}
          >
            {confirmar ? "¿Eliminar?" : "Eliminar"}
          </button>
        </div>
      </div>

      {/* Chips de contexto */}
      <div className="flex flex-wrap gap-2 px-4 pt-4">
        <span className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-muted-foreground">
          {rutina.contenido.nivel?.split(" ")[0]}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-muted-foreground">
          {rutina.contenido.tiempo} min
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-muted-foreground">
          {rutina.contenido.lugar?.split(" ")[0]}
        </span>
        {rutina.contenido.metricas?.sueno !== undefined && rutina.contenido.metricas.sueno < 7 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center gap-1">
            <Moon className="h-3 w-3" /> {rutina.contenido.metricas.sueno}h sueño
          </span>
        )}
        {rutina.contenido.metricas?.estres !== undefined && rutina.contenido.metricas.estres > 5 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber/10 border border-amber/20 text-amber flex items-center gap-1">
            <Brain className="h-3 w-3" /> Estrés {rutina.contenido.metricas.estres}/10
          </span>
        )}
      </div>

      <div className="px-4 py-4 pb-16">
        {formatearContenido(rutina.contenido.texto)}
      </div>
    </div>
  );
}

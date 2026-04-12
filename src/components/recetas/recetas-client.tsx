"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ChefHat, Sparkles, BookOpen, Loader2, ImageIcon,
  Bookmark, Trash2, RefreshCw, ArrowLeft, Clock, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnonymousId } from "@/hooks/use-anonymous-id";
import {
  guardarReceta, getRecetasGuardadas, eliminarReceta,
  uploadRecetaImagen, type RecetaRow,
} from "@/lib/supabase/recetas";

// ─── helpers ────────────────────────────────────────────────────────────────

function extraerTitulo(texto: string): string {
  const match = texto.match(/^##\s+(.+)/m);
  return match?.[1]?.trim() ?? "Receta cardioprotectora";
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
          : p
      )}
    </>
  );
}

function formatearContenido(texto: string, compact = false): React.ReactNode {
  const lineas = texto.split("\n");
  const base = compact ? "text-xs" : "text-sm";
  return lineas.map((linea, i) => {
    if (linea.startsWith("## "))
      return <h2 key={i} className={`${compact ? "text-base" : "text-lg"} font-bold text-foreground mt-4 mb-2 first:mt-0`}>{linea.slice(3)}</h2>;
    if (linea.startsWith("### "))
      return <h3 key={i} className={`${base} font-semibold text-teal uppercase tracking-widest mt-4 mb-2`}>{linea.slice(4)}</h3>;
    if (linea.match(/^\*\*.+\*\*$/) && !linea.slice(2, -2).includes("**")) {
      const inner = linea.slice(2, -2);
      if (inner.includes("|")) {
        return (
          <p key={i} className={`${base} text-muted-foreground mb-2 flex gap-3 flex-wrap`}>
            {inner.split("|").map((c, j) => <span key={j}>{renderBold(c.trim())}</span>)}
          </p>
        );
      }
      return <p key={i} className={`${base} font-semibold text-foreground mb-1`}>{inner}</p>;
    }
    if (linea.startsWith("- "))
      return (
        <div key={i} className={`flex gap-2 ${base} text-foreground/90 mb-1`}>
          <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
          <span>{renderBold(linea.slice(2))}</span>
        </div>
      );
    if (linea.match(/^\d+\.\s/)) {
      const num = linea.match(/^(\d+)\.\s/)?.[1];
      const content = linea.replace(/^\d+\.\s/, "");
      return (
        <div key={i} className={`flex gap-2 ${base} text-foreground/90 mb-1.5`}>
          <span className="text-teal font-bold shrink-0 min-w-[1.25rem] text-right">{num}.</span>
          <span>{renderBold(content)}</span>
        </div>
      );
    }
    if (linea.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className={`${base} text-foreground/90 mb-1 leading-relaxed`}>{renderBold(linea)}</p>;
  });
}

// ─── types ───────────────────────────────────────────────────────────────────

type Vista = "nueva" | "guardadas";
type EstadoGeneracion = "idle" | "streaming" | "imagen" | "completo";

// ─── componente principal ─────────────────────────────────────────────────────

export function RecetasClient() {
  const uid = useAnonymousId();

  const [vista, setVista] = useState<Vista>("nueva");
  const [ingredientes, setIngredientes] = useState("");

  // Generación
  const [estado, setEstado] = useState<EstadoGeneracion>("idle");
  const [recetaTexto, setRecetaTexto] = useState("");
  const [textoMostrado, setTextoMostrado] = useState("");
  const recetaRef = useRef("");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guardadas
  const [guardadas, setGuardadas] = useState<RecetaRow[]>([]);
  const [cargandoGuardadas, setCargandoGuardadas] = useState(false);

  // Vista detalle
  const [recetaDetalle, setRecetaDetalle] = useState<RecetaRow | null>(null);

  // ── typewriter ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (textoMostrado.length >= recetaRef.current.length) return;
    const full = recetaRef.current;
    const shown = textoMostrado;
    const nextSpace = full.indexOf(" ", shown.length);
    const nextEnd = nextSpace === -1 ? full.length : nextSpace + 1;
    const timer = setTimeout(() => setTextoMostrado(full.slice(0, nextEnd)), 35);
    return () => clearTimeout(timer);
  }, [recetaTexto, textoMostrado]);

  // ── generar receta ──────────────────────────────────────────────────────
  const generarReceta = useCallback(async () => {
    if (!ingredientes.trim() || estado === "streaming" || estado === "imagen") return;
    setEstado("streaming");
    setRecetaTexto("");
    setTextoMostrado("");
    recetaRef.current = "";
    setImagenUrl(null);
    setGuardada(false);
    setError(null);

    try {
      const res = await fetch("/api/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientes: ingredientes.trim() }),
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
                recetaRef.current = textoCompleto;
                setRecetaTexto(textoCompleto);
              }
            } catch { /* skip */ }
          }
        }
      }

      setEstado("imagen");
      await generarImagen(extraerTitulo(textoCompleto));
      setEstado("completo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setEstado("idle");
    }
  }, [ingredientes, estado]);

  const generarImagen = async (titulo: string) => {
    try {
      const res = await fetch("/api/recetas/imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imagen) setImagenUrl(data.imagen);
      }
    } catch { /* silencioso */ }
  };

  // ── guardar receta ──────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!uid || !recetaTexto || guardando || guardada) return;
    setGuardando(true);

    const titulo = extraerTitulo(recetaTexto);
    const ingredientesArray = ingredientes.split(/[,\n]+/).map((i) => i.trim()).filter(Boolean);

    // Subir imagen al Storage (si existe y es base64)
    let urlFinal: string | null = imagenUrl;
    if (imagenUrl?.startsWith("data:")) {
      const uploaded = await uploadRecetaImagen(uid, imagenUrl);
      urlFinal = uploaded; // null si falla — receta igual se guarda sin imagen
    }

    const { error: errDB } = await guardarReceta(uid, titulo, recetaTexto, urlFinal, ingredientesArray);
    if (!errDB) {
      setGuardada(true);
    } else {
      setError("No se pudo guardar la receta. Intenta de nuevo.");
    }
    setGuardando(false);
  };

  // ── guardadas ───────────────────────────────────────────────────────────
  const cargarGuardadas = useCallback(async () => {
    if (!uid) return;
    setCargandoGuardadas(true);
    setGuardadas(await getRecetasGuardadas(uid));
    setCargandoGuardadas(false);
  }, [uid]);

  const handleVistaGuardadas = () => {
    setVista("guardadas");
    cargarGuardadas();
  };

  const handleEliminar = async (id: string) => {
    await eliminarReceta(id);
    setGuardadas((prev) => prev.filter((r) => r.id !== id));
    if (recetaDetalle?.id === id) setRecetaDetalle(null);
  };

  const resetear = () => {
    setEstado("idle");
    setRecetaTexto("");
    setTextoMostrado("");
    recetaRef.current = "";
    setImagenUrl(null);
    setGuardada(false);
    setError(null);
    setIngredientes("");
  };

  const escribiendo = textoMostrado.length < recetaRef.current.length || estado === "streaming";
  const hayContenido = textoMostrado.length > 0;

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5 animate-fade-in">

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-surface p-1 border border-border w-fit">
          <button
            onClick={() => setVista("nueva")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              vista === "nueva" ? "bg-teal/15 text-teal border border-teal/30" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChefHat className="h-3.5 w-3.5" />
            Nueva receta
          </button>
          <button
            onClick={handleVistaGuardadas}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              vista === "guardadas" ? "bg-teal/15 text-teal border border-teal/30" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Guardadas
          </button>
        </div>

        {/* ── Nueva receta ───────────────────────────────────────────────── */}
        {vista === "nueva" && (
          <div className="space-y-4">
            {(estado === "idle" || estado === "completo") && (
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">
                  ¿Qué ingredientes tienes?
                </label>
                <textarea
                  value={ingredientes}
                  onChange={(e) => setIngredientes(e.target.value)}
                  placeholder="Ej: pollo, espinacas, ajo, aceite de oliva, limón..."
                  rows={3}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/30 transition-all"
                />
                {error && (
                  <p className="text-xs text-coral bg-coral/10 border border-coral/20 rounded-lg px-3 py-2">{error}</p>
                )}
                <div className="flex items-center gap-2">
                  {estado === "completo" && (
                    <Button variant="ghost" onClick={resetear} className="gap-1.5 text-muted-foreground border border-border text-sm">
                      <RefreshCw className="h-3.5 w-3.5" /> Nueva
                    </Button>
                  )}
                  <Button
                    onClick={generarReceta}
                    disabled={!ingredientes.trim()}
                    className="gap-2 bg-teal hover:bg-teal/90 text-background font-semibold ml-auto"
                  >
                    <Sparkles className="h-4 w-4" /> Generar receta
                  </Button>
                </div>
              </div>
            )}

            {/* Resultado */}
            {(estado === "streaming" || estado === "imagen" || estado === "completo") && hayContenido && (
              <div className="rounded-xl border border-teal/25 bg-teal/5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-teal/20">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-teal" />
                    <span className="text-sm font-bold text-teal">Receta cardioprotectora</span>
                  </div>
                  {estado === "imagen" && (
                    <div className="flex items-center gap-1.5 text-xs text-purple">
                      <ImageIcon className="h-3 w-3" />
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Generando imagen...</span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* Imagen / skeleton */}
                  {(estado === "imagen" || estado === "completo") && (
                    <div className="rounded-lg overflow-hidden border border-border aspect-video">
                      {imagenUrl ? (
                        <img src={imagenUrl} alt="Foto del plato" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-2 relative overflow-hidden">
                          <div
                            className="absolute inset-0 animate-shimmer"
                            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(163,113,247,0.07) 50%, transparent 100%)" }}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-purple/10 border border-purple/20 flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-purple/50" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Loader2 className="h-3 w-3 animate-spin text-purple/70" />
                              <span className="text-xs text-muted-foreground">Generando imagen con IA...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Texto typewriter */}
                  <div>
                    {formatearContenido(textoMostrado)}
                    {escribiendo && <span className="inline-block w-0.5 h-4 bg-teal ml-0.5 animate-blink align-middle" />}
                  </div>

                  {/* Acciones */}
                  {estado === "completo" && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                      {!guardada ? (
                        <Button
                          onClick={handleGuardar}
                          disabled={guardando || !uid}
                          variant="ghost"
                          className="gap-2 text-teal border border-teal/30 hover:bg-teal/10"
                        >
                          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                          {guardando ? "Guardando..." : "Guardar receta"}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-teal">
                          <Bookmark className="h-4 w-4 fill-teal" />
                          Receta guardada
                        </div>
                      )}
                      <button onClick={resetear} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Nueva receta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {estado === "idle" && (
              <div className="rounded-xl border border-dashed border-border/60 bg-surface/50 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto">
                  <ChefHat className="h-6 w-6 text-teal/60" />
                </div>
                <p className="text-sm font-medium text-foreground/70">Escribe tus ingredientes</p>
                <p className="text-xs text-muted-foreground">
                  Claude creará una receta cardioprotectora y Gemini generará la foto del plato.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Guardadas ──────────────────────────────────────────────────── */}
        {vista === "guardadas" && (
          <div className="space-y-3">
            {cargandoGuardadas ? (
              <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Cargando recetas...</span>
              </div>
            ) : guardadas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-surface/50 p-10 text-center space-y-2">
                <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">Aún no tienes recetas guardadas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {guardadas.map((receta) => (
                  <RecetaCard
                    key={receta.id}
                    receta={receta}
                    onVerCompleta={() => setRecetaDetalle(receta)}
                    onEliminar={() => handleEliminar(receta.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Vista detalle pantalla completa ──────────────────────────────── */}
      {recetaDetalle && (
        <RecetaDetalle
          receta={recetaDetalle}
          onCerrar={() => setRecetaDetalle(null)}
          onEliminar={() => handleEliminar(recetaDetalle.id)}
        />
      )}
    </>
  );
}

// ─── tarjeta (lista guardadas) ────────────────────────────────────────────────

function RecetaCard({
  receta,
  onVerCompleta,
  onEliminar,
}: {
  receta: RecetaRow;
  onVerCompleta: () => void;
  onEliminar: () => void;
}) {
  const fecha = new Date(receta.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <button
      onClick={onVerCompleta}
      className="rounded-xl border border-border bg-surface overflow-hidden text-left hover:border-teal/30 hover:bg-surface-2 transition-all group w-full"
    >
      {/* Imagen */}
      {receta.imagen_url ? (
        <div className="aspect-video overflow-hidden">
          <img src={receta.imagen_url} alt={receta.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="aspect-video bg-surface-2 flex items-center justify-center">
          <ChefHat className="h-8 w-8 text-muted-foreground/20" />
        </div>
      )}

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{receta.titulo}</h3>
          <button
            onClick={(e) => { e.stopPropagation(); onEliminar(); }}
            className="text-muted-foreground hover:text-coral transition-colors shrink-0 p-0.5"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {receta.ingredientes?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {receta.ingredientes.slice(0, 3).map((ing, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">
                  {ing}
                </span>
              ))}
              {receta.ingredientes.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface text-muted-foreground border border-border">
                  +{receta.ingredientes.length - 3}
                </span>
              )}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">{fecha}</span>
        </div>
      </div>
    </button>
  );
}

// ─── vista detalle pantalla completa ─────────────────────────────────────────

function RecetaDetalle({
  receta,
  onCerrar,
  onEliminar,
}: {
  receta: RecetaRow;
  onCerrar: () => void;
  onEliminar: () => void;
}) {
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const handleEliminar = () => {
    if (!confirmarEliminar) { setConfirmarEliminar(true); return; }
    onEliminar();
  };

  // Extraer tiempo y porciones del contenido
  const tiempoMatch = receta.contenido.match(/Tiempo[:\s]+(\d+\s*minutos?)/i);
  const porcionesMatch = receta.contenido.match(/Porciones[:\s]+(\d+)/i);

  return (
    <div className="fixed inset-0 z-50 bg-background animate-slide-in-right overflow-y-auto">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onCerrar}
            className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-foreground hover:bg-surface-2 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-semibold text-foreground truncate flex-1">{receta.titulo}</h2>
          <button
            onClick={handleEliminar}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              confirmarEliminar
                ? "bg-coral/10 border-coral/30 text-coral"
                : "border-border text-muted-foreground hover:text-coral"
            }`}
          >
            {confirmarEliminar ? "¿Eliminar?" : "Eliminar"}
          </button>
        </div>
      </div>

      {/* Imagen full width */}
      {receta.imagen_url && (
        <div className="w-full aspect-video overflow-hidden">
          <img src={receta.imagen_url} alt={receta.titulo} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Chips de metadata */}
      {(tiempoMatch || porcionesMatch) && (
        <div className="flex gap-3 px-4 pt-4">
          {porcionesMatch && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface border border-border rounded-full px-3 py-1">
              <Users className="h-3 w-3" />
              {porcionesMatch[1]} porciones
            </div>
          )}
          {tiempoMatch && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface border border-border rounded-full px-3 py-1">
              <Clock className="h-3 w-3" />
              {tiempoMatch[1]}
            </div>
          )}
        </div>
      )}

      {/* Contenido completo */}
      <div className="px-4 py-4 pb-16">
        {formatearContenido(receta.contenido)}
      </div>
    </div>
  );
}

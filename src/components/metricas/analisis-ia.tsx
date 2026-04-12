"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEstado, ESTADO_LABEL, METRICA_MAP } from "@/lib/metricas-config";
import type { MetricaRow } from "@/lib/supabase/metricas";

interface Props {
  metricas: MetricaRow[];
}

export function AnalisisIA({ metricas }: Props) {
  const [texto,    setTexto]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [listo,    setListo]    = useState(false);

  async function analizar() {
    if (metricas.length === 0) return;
    setLoading(true);
    setTexto("");
    setListo(false);

    const payload = metricas.map((m) => ({
      label:  METRICA_MAP[m.tipo]?.label ?? m.tipo,
      valor:  m.valor,
      unidad: m.unidad,
      estado: ESTADO_LABEL[getEstado(m.tipo, m.valor)],
    }));

    try {
      const res = await fetch("/api/analisis-metricas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ metricas: payload }),
      });

      if (!res.ok || !res.body) throw new Error("Error al conectar con la IA");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Vercel AI SDK data stream format
            try {
              const chunk = JSON.parse(line.slice(2));
              if (typeof chunk === "string") setTexto((p) => p + chunk);
            } catch { /* ignorar líneas malformadas */ }
          }
        }
      }

      setListo(true);
    } catch (err) {
      setTexto("No se pudo conectar con el análisis. Verifica tu conexión e intenta de nuevo.");
      setListo(true);
    } finally {
      setLoading(false);
    }
  }

  if (metricas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-center text-sm text-muted-foreground">
        Registra al menos una métrica para obtener tu análisis personalizado.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple/30 bg-purple/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple" />
          <span className="text-sm font-bold text-purple">Análisis IA</span>
        </div>
        {(listo || texto) && (
          <button
            onClick={analizar}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="p-4">
        {!texto && !loading && (
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Claude analiza tus métricas y te da recomendaciones personalizadas.
            </p>
            <Button variant="ghost" className="gap-2 text-purple border border-purple/30" onClick={analizar}>
              <Sparkles className="h-4 w-4" />
              Analizar mis métricas
            </Button>
          </div>
        )}

        {loading && !texto && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-purple" />
            Analizando tus métricas...
          </div>
        )}

        {texto && (
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {texto}
            {loading && (
              <span className="inline-block w-0.5 h-4 bg-purple ml-0.5 animate-blink align-middle" />
            )}
          </div>
        )}

        {listo && (
          <p className="mt-3 text-[10px] text-muted-foreground border-t border-border/50 pt-2">
            ⚕️ Orientación educativa — no reemplaza la consulta médica.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  METRICAS,
  getEstado,
  ESTADO_COLORS,
  ESTADO_BG,
  ESTADO_LABEL,
} from "@/lib/metricas-config";
import type { MetricaRow } from "@/lib/supabase/metricas";
import type { MetricaType } from "@/lib/supabase/types";

interface Props {
  metricas:  MetricaRow[];
  onSelect:  (tipo: MetricaType) => void;
  seleccion: MetricaType | null;
}

export function TarjetasResumen({ metricas, onSelect, seleccion }: Props) {
  const mapaUltimas = Object.fromEntries(metricas.map((m) => [m.tipo, m.valor]));

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {METRICAS.map((cfg) => {
        const valor   = mapaUltimas[cfg.tipo];
        const tieneData = valor !== undefined;
        const estado  = tieneData ? getEstado(cfg.tipo, valor) : "sin-datos";
        const activa  = seleccion === cfg.tipo;

        return (
          <button
            key={cfg.tipo}
            onClick={() => onSelect(cfg.tipo)}
            className={cn(
              "rounded-xl border p-3 text-left transition-all duration-200 active:scale-95",
              activa
                ? "border-coral/50 bg-coral/8 ring-1 ring-coral/30"
                : "border-border bg-surface hover:border-border/80 hover:bg-surface-2"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">{cfg.emoji}</span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  ESTADO_BG[estado]
                )}
              >
                {ESTADO_LABEL[estado]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-0.5 truncate">{cfg.label}</p>
            {tieneData ? (
              <p className={cn("text-lg font-bold leading-none", ESTADO_COLORS[estado])}>
                {cfg.paso < 1 ? valor.toFixed(1) : Math.round(valor)}
                <span className="text-xs font-normal text-muted-foreground ml-1">{cfg.unidad}</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">Sin datos</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

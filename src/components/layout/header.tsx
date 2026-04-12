"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const titles: Record<string, { label: string; desc: string }> = {
  "/dashboard": { label: "Métricas",  desc: "Tu salud cardiovascular hoy" },
  "/recetas":   { label: "Recetas",   desc: "Cocina saludable para tu corazón" },
  "/rutinas":   { label: "Rutinas",   desc: "Ejercicio adaptado a tu perfil" },
  "/calendario":{ label: "Hábitos",   desc: "Tu seguimiento diario" },
  "/score":     { label: "Mi Score",  desc: "Análisis de riesgo cardiovascular" },
  "/tips":      { label: "Tips",      desc: "Consejos personalizados" },
};

export function Header() {
  const pathname = usePathname();
  const base    = "/" + (pathname.split("/")[1] ?? "");
  const info    = titles[base] ?? { label: "Pulso", desc: "" };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-6">
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">
          {info.label}
        </h1>
        {info.desc && (
          <p className="text-xs text-muted-foreground">{info.desc}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

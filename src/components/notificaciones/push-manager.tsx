"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, BellOff, Check, Loader2, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function mostrarNotificacion(titulo: string, cuerpo: string, url = "/dashboard") {
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(titulo, {
    body: cuerpo,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url },
    // @ts-expect-error — renotify es válido pero no está en todos los tipos
    renotify: true,
    tag: "pulso-recordatorio",
  });
}

function msHasta(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  const ahora = new Date();
  const objetivo = new Date();
  objetivo.setHours(h, m, 0, 0);
  if (objetivo <= ahora) objetivo.setDate(objetivo.getDate() + 1);
  return objetivo.getTime() - ahora.getTime();
}

function formatearTiempo(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return resto > 0 ? `${h}h ${resto}min` : `${h}h`;
}

// ─── recordatorios predefinidos ───────────────────────────────────────────────

const RECORDATORIOS = [
  { id: "alimentacion", emoji: "🥗", label: "Alimentación",  titulo: "Pulso — Hora de comer bien",    cuerpo: "¿Ya revisaste tu alimentación hoy? Genera una receta saludable.", url: "/recetas" },
  { id: "metricas",    emoji: "❤️", label: "Métricas",       titulo: "Pulso — Registra tus métricas", cuerpo: "Tómate un minuto para registrar cómo estás hoy.",               url: "/dashboard" },
  { id: "habitos",     emoji: "✅", label: "Hábitos",         titulo: "Pulso — Revisa tus hábitos",    cuerpo: "¿Completaste tus hábitos del día?",                            url: "/calendario" },
  { id: "ejercicio",   emoji: "💪", label: "Ejercicio",       titulo: "Pulso — Hora de moverse",       cuerpo: "Tu rutina de hoy te está esperando.",                          url: "/rutinas" },
];

// ─── componente ───────────────────────────────────────────────────────────────

export function PushManager() {
  const [permiso, setPermiso] = useState<NotificationPermission | "unsupported">("default");
  const [registrando, setRegistrando] = useState(false);
  const [programados, setProgramados] = useState<Record<string, { hora: string; timer: ReturnType<typeof setTimeout> }>>({});
  const [horaSelec, setHoraSelec] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<string | null>(null);
  const resultadoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function mostrarResultado(msg: string) {
    setResultado(msg);
    if (resultadoTimer.current) clearTimeout(resultadoTimer.current);
    resultadoTimer.current = setTimeout(() => setResultado(null), 4000);
  }

  // ── estado inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermiso("unsupported");
      return;
    }
    setPermiso(Notification.permission);
    navigator.serviceWorker.register("/sw.js").catch(console.error);

    // Hora por defecto para cada recordatorio
    setHoraSelec({ alimentacion: "13:00", metricas: "09:00", habitos: "21:00", ejercicio: "08:00" });
  }, []);

  // ── activar permisos ────────────────────────────────────────────────────────
  async function activar() {
    setRegistrando(true);
    const result = await Notification.requestPermission();
    setPermiso(result);
    setRegistrando(false);
    if (result === "granted") mostrarResultado("✓ Notificaciones activadas");
  }

  // ── enviar prueba inmediata ─────────────────────────────────────────────────
  async function enviarPrueba() {
    try {
      await mostrarNotificacion(
        "Pulso 💚 — Prueba",
        "¡Las notificaciones funcionan! Cuida tu corazón hoy.",
        "/dashboard"
      );
      mostrarResultado("✓ Notificación enviada");
    } catch {
      mostrarResultado("Error al enviar — ¿diste permiso al browser?");
    }
  }

  // ── programar recordatorio ──────────────────────────────────────────────────
  function programar(id: string) {
    const hora = horaSelec[id];
    if (!hora) return;

    // Cancelar si ya existía
    if (programados[id]) clearTimeout(programados[id].timer);

    const ms = msHasta(hora);
    const rec = RECORDATORIOS.find((r) => r.id === id)!;

    const timer = setTimeout(async () => {
      await mostrarNotificacion(rec.titulo, rec.cuerpo, rec.url);
      setProgramados((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }, ms);

    setProgramados((prev) => ({ ...prev, [id]: { hora, timer } }));
    mostrarResultado(`✓ Recordatorio en ${formatearTiempo(ms)}`);
  }

  function cancelar(id: string) {
    if (programados[id]) clearTimeout(programados[id].timer);
    setProgramados((prev) => { const n = { ...prev }; delete n[id]; return n; });
    mostrarResultado("Recordatorio cancelado");
  }

  // ── renders ─────────────────────────────────────────────────────────────────
  if (permiso === "unsupported") {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-muted-foreground">
          Tu navegador no soporta notificaciones. Prueba instalando la app en Chrome (Android) o Safari (iOS 16.4+).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Estado */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={cn("h-9 w-9 rounded-full flex items-center justify-center",
            permiso === "granted" ? "bg-teal/15" : "bg-surface-2")}>
            {permiso === "granted"
              ? <Bell className="h-4 w-4 text-teal" />
              : <BellOff className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div>
            <p className="text-sm font-medium">
              {permiso === "granted" ? "Notificaciones activas" :
               permiso === "denied"  ? "Notificaciones bloqueadas" :
                                       "Notificaciones desactivadas"}
            </p>
            <p className="text-xs text-muted-foreground">
              {permiso === "granted" ? "Las notificaciones funcionan en este dispositivo" :
               permiso === "denied"  ? "Actívalas manualmente en ajustes del navegador" :
                                       "Toca activar para recibir recordatorios"}
            </p>
          </div>
        </div>

        {permiso !== "granted" && permiso !== "denied" && (
          <button onClick={activar} disabled={registrando}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal/10 text-teal border border-teal/30 text-sm font-semibold hover:bg-teal/20 transition-all disabled:opacity-50">
            {registrando
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><Bell className="h-4 w-4" /> Activar notificaciones</>}
          </button>
        )}

        {permiso === "granted" && (
          <button onClick={enviarPrueba}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-2 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-all">
            <Bell className="h-3.5 w-3.5" /> Enviar prueba ahora
          </button>
        )}
      </div>

      {/* Recordatorios — solo si hay permiso */}
      {permiso === "granted" && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Recordatorios diarios
          </h3>
          <p className="text-xs text-muted-foreground -mt-1">
            Se activan una vez a la hora indicada mientras la app esté abierta en segundo plano.
          </p>

          {RECORDATORIOS.map((rec) => {
            const activo = !!programados[rec.id];
            return (
              <div key={rec.id} className={cn(
                "rounded-xl border p-3 transition-all",
                activo ? "border-teal/30 bg-teal/5" : "border-border bg-surface"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{rec.emoji}</span>
                  <span className="text-sm font-medium flex-1">{rec.label}</span>
                  {activo && (
                    <span className="text-[10px] text-teal font-semibold bg-teal/10 px-2 py-0.5 rounded-full border border-teal/20">
                      {programados[rec.id].hora}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input
                      type="time"
                      value={horaSelec[rec.id] ?? ""}
                      onChange={(e) => setHoraSelec((p) => ({ ...p, [rec.id]: e.target.value }))}
                      disabled={activo}
                      className="w-full rounded-lg bg-surface-2 border border-border pl-7 pr-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-60"
                    />
                  </div>

                  {activo ? (
                    <button onClick={() => cancelar(rec.id)}
                      className="px-3 py-1.5 rounded-lg bg-coral/10 text-coral border border-coral/30 text-xs font-semibold hover:bg-coral/20 transition-all flex items-center gap-1">
                      <X className="h-3.5 w-3.5" /> Cancelar
                    </button>
                  ) : (
                    <button onClick={() => programar(rec.id)}
                      disabled={!horaSelec[rec.id]}
                      className="px-3 py-1.5 rounded-lg bg-teal/10 text-teal border border-teal/30 text-xs font-semibold hover:bg-teal/20 transition-all disabled:opacity-50 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Activar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resultado flotante */}
      {resultado && (
        <p className={cn(
          "text-xs text-center py-2 px-3 rounded-lg transition-all",
          resultado.startsWith("Error") ? "bg-coral/10 text-coral" : "bg-teal/10 text-teal"
        )}>
          {resultado}
        </p>
      )}

    </div>
  );
}

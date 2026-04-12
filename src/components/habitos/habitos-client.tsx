"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, X, Check, Dumbbell, Loader2, ChevronRight, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnonymousId } from "@/hooks/use-anonymous-id";
import { getRutinasGuardadas, type RutinaRow, type Ejercicio } from "@/lib/supabase/rutinas";
import {
  getHabitosDefinicion, crearHabitoDefinicion, eliminarHabitoDefinicion,
  getHabitosFecha, getHabitosSemana,
  toggleHabitoFijo, toggleHabitoRegistro,
  type HabitoDefinicionRow,
} from "@/lib/supabase/habitos";

// ─── constantes ───────────────────────────────────────────────────────────────

const DIAS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

const HABITOS_FIJOS = [
  { tipo: "hidratacion", emoji: "💧", label: "Hidratación" },
  { tipo: "alimentacion", emoji: "🥗", label: "Alimentación saludable" },
  { tipo: "sueno",        emoji: "😴", label: "Dormir bien" },
  { tipo: "medicamento",  emoji: "💊", label: "Medicamentos" },
] as const;

const EMOJIS_PICKER = ["🎯","💪","📚","🧘","🚶","🧴","🍎","🥑","☕","🌿","🫀","🧠","😊","⏰","🛁","🎵","✍️","🌅","🥛","🍵"];

// ─── helpers ──────────────────────────────────────────────────────────────────

function hoyISO(): string {
  return new Date().toISOString().split("T")[0];
}

function getSemanaActual(): string[] {
  const hoy = new Date();
  const dow = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function diaLabel(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  return DIAS_CORTOS[d.getDay()];
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function ejerciciosDelDia(rutina: RutinaRow | null): Ejercicio[] {
  if (!rutina?.contenido.ejercicios) return [];
  const hoyDia = normalizar(DIAS_ES[new Date().getDay()]);
  return rutina.contenido.ejercicios.filter((e) =>
    normalizar(e.bloque).includes(hoyDia)
  );
}

// ─── toggle item ──────────────────────────────────────────────────────────────

function ToggleItem({
  emoji, label, done, onToggle, cargando = false,
}: {
  emoji: string; label: string; done: boolean; onToggle: () => void; cargando?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={cargando}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all active:scale-98",
        done
          ? "border-teal/30 bg-teal/8"
          : "border-border bg-surface hover:border-border/80 hover:bg-surface-2"
      )}
    >
      <div className={cn(
        "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
        done ? "border-teal bg-teal" : "border-border"
      )}>
        {cargando
          ? <Loader2 className="h-3 w-3 animate-spin text-background" />
          : done && <Check className="h-3 w-3 text-background" strokeWidth={3} />
        }
      </div>
      <span className="text-base mr-1">{emoji}</span>
      <span className={cn("text-sm flex-1 transition-colors", done ? "line-through text-muted-foreground" : "text-foreground")}>
        {label}
      </span>
    </button>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export function HabitosClient() {
  const uid = useAnonymousId();
  const [tab, setTab] = useState<"hoy" | "semana" | "gestionar">("hoy");

  // datos
  const [rutinaActiva, setRutinaActiva] = useState<RutinaRow | null>(null);
  const [habitosDef, setHabitosDef] = useState<HabitoDefinicionRow[]>([]);
  const [cargando, setCargando] = useState(true);

  // completados hoy
  const [fijosDone, setFijosDone] = useState<Set<string>>(new Set());
  const [registroDone, setRegistroDone] = useState<Set<string>>(new Set());

  // semana
  const [semanaData, setSemanaData] = useState<Record<string, number>>({});
  const [cargandoSemana, setCargandoSemana] = useState(false);

  // toggles en vuelo
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  // form nuevo hábito
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmoji, setNuevoEmoji] = useState("🎯");
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  const fecha = hoyISO();

  // ── carga inicial ───────────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    if (!uid) return;
    setCargando(true);
    const [rutinas, defs, { fijos, registro }] = await Promise.all([
      getRutinasGuardadas(uid),
      getHabitosDefinicion(uid),
      getHabitosFecha(uid, fecha),
    ]);
    setRutinaActiva(rutinas[0] ?? null);
    setHabitosDef(defs);
    setFijosDone(new Set(fijos.filter((f) => f.completado).map((f) => f.tipo)));
    setRegistroDone(new Set(registro.map((r) => r.ref_id)));
    setCargando(false);
  }, [uid, fecha]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── carga semana ────────────────────────────────────────────────────────────
  const cargarSemana = useCallback(async () => {
    if (!uid) return;
    setCargandoSemana(true);
    const dias = getSemanaActual();
    const { fijos, registro } = await getHabitosSemana(uid, dias[0], dias[6]);
    const conteo: Record<string, number> = {};
    dias.forEach((d) => { conteo[d] = 0; });
    fijos.filter((f) => f.completado).forEach((f) => { conteo[f.fecha] = (conteo[f.fecha] ?? 0) + 1; });
    registro.forEach((r) => { conteo[r.fecha] = (conteo[r.fecha] ?? 0) + 1; });
    setSemanaData(conteo);
    setCargandoSemana(false);
  }, [uid]);

  useEffect(() => {
    if (tab === "semana") cargarSemana();
  }, [tab, cargarSemana]);

  // ── toggles ─────────────────────────────────────────────────────────────────
  async function toggleFijo(tipo: string) {
    const key = `fijo-${tipo}`;
    if (toggling.has(key)) return;
    const done = !fijosDone.has(tipo);
    setFijosDone((prev) => { const n = new Set(prev); done ? n.add(tipo) : n.delete(tipo); return n; });
    setToggling((prev) => new Set(prev).add(key));
    await toggleHabitoFijo(uid!, fecha, tipo, done);
    setToggling((prev) => { const n = new Set(prev); n.delete(key); return n; });
  }

  async function toggleRegistro(refId: string, tipo: string) {
    const key = `reg-${refId}`;
    if (toggling.has(key)) return;
    const done = !registroDone.has(refId);
    setRegistroDone((prev) => { const n = new Set(prev); done ? n.add(refId) : n.delete(refId); return n; });
    setToggling((prev) => new Set(prev).add(key));
    await toggleHabitoRegistro(uid!, fecha, tipo, refId, done);
    setToggling((prev) => { const n = new Set(prev); n.delete(key); return n; });
  }

  // ── agregar hábito ──────────────────────────────────────────────────────────
  async function handleCrearHabito() {
    if (!uid || !nuevoNombre.trim()) return;
    setGuardandoNuevo(true);
    const { error } = await crearHabitoDefinicion(uid, nuevoNombre.trim(), nuevoEmoji);
    if (!error) {
      await cargarDatos();
      setNuevoNombre("");
      setNuevoEmoji("🎯");
      setMostrandoForm(false);
    }
    setGuardandoNuevo(false);
  }

  async function handleEliminarHabito(id: string) {
    await eliminarHabitoDefinicion(id);
    setHabitosDef((prev) => prev.filter((h) => h.id !== id));
  }

  // ── resumen hoy ──────────────────────────────────────────────────────────────
  const ejHoy = ejerciciosDelDia(rutinaActiva);
  const totalHoy = HABITOS_FIJOS.length + habitosDef.length + ejHoy.length;
  const completadosHoy = [...fijosDone].length +
    [...registroDone].filter((r) => !r.startsWith("ej-") || ejHoy.some((e) => `ej-${e.nombre}` === r)).length;

  const hoyFecha = new Date();
  const hoyLabel = `${DIAS_ES[hoyFecha.getDay()]} ${hoyFecha.getDate()} de ${MESES_ES[hoyFecha.getMonth()]}`;

  if (!uid || cargando) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando hábitos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
        {(["hoy", "semana", "gestionar"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
              tab === t ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "hoy" ? "Hoy" : t === "semana" ? "Semana" : "Gestionar"}
          </button>
        ))}
      </div>

      {/* ─── Tab Hoy ─────────────────────────────────────────────────── */}
      {tab === "hoy" && (
        <div className="space-y-5">

          {/* Header fecha + progreso */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Hoy</p>
                <p className="text-base font-bold text-foreground capitalize">{hoyLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-teal">{completadosHoy}</p>
                <p className="text-xs text-muted-foreground">de {totalHoy}</p>
              </div>
            </div>
            {totalHoy > 0 && (
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-all duration-500"
                  style={{ width: `${(completadosHoy / totalHoy) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Rutina de hoy */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Rutina de hoy
            </h3>
            {rutinaActiva === null ? (
              <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Sin rutina activa</p>
                <a href="/rutinas" className="text-xs text-coral hover:underline inline-flex items-center gap-1">
                  Genera una rutina <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            ) : ejHoy.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-4 text-center">
                <p className="text-sm text-muted-foreground">Hoy es día de descanso 🧘</p>
                <p className="text-xs text-muted-foreground mt-1">Aprovecha para recuperarte.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ejHoy.map((ej) => {
                  const refId = `ej-${ej.nombre}`;
                  return (
                    <ToggleItem
                      key={refId}
                      emoji="🏋️"
                      label={`${ej.nombre} — ${ej.detalle}`}
                      done={registroDone.has(refId)}
                      cargando={toggling.has(`reg-${refId}`)}
                      onToggle={() => toggleRegistro(refId, "ejercicio")}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Hábitos fijos + custom */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Hábitos
              </h3>
              <button
                onClick={() => setMostrandoForm(true)}
                className="flex items-center gap-1 text-xs text-coral hover:text-coral/80 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Nuevo
              </button>
            </div>

            <div className="space-y-2">
              {HABITOS_FIJOS.map((h) => (
                <ToggleItem
                  key={h.tipo}
                  emoji={h.emoji}
                  label={h.label}
                  done={fijosDone.has(h.tipo)}
                  cargando={toggling.has(`fijo-${h.tipo}`)}
                  onToggle={() => toggleFijo(h.tipo)}
                />
              ))}

              {habitosDef.map((h) => (
                <ToggleItem
                  key={h.id}
                  emoji={h.emoji}
                  label={h.nombre}
                  done={registroDone.has(h.id)}
                  cargando={toggling.has(`reg-${h.id}`)}
                  onToggle={() => toggleRegistro(h.id, "habito_custom")}
                />
              ))}

              {habitosDef.length === 0 && (
                <button
                  onClick={() => setMostrandoForm(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-dashed border-border bg-surface text-muted-foreground hover:border-coral/30 hover:text-foreground transition-all"
                >
                  <div className="h-6 w-6 rounded-full border-2 border-dashed border-border flex items-center justify-center shrink-0">
                    <Plus className="h-3 w-3" />
                  </div>
                  <span className="text-sm">Agrega tu primer hábito personalizado</span>
                </button>
              )}
            </div>
          </div>

          {/* Form nuevo hábito */}
          {mostrandoForm && (
            <div className="rounded-xl border border-coral/30 bg-surface p-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Nuevo hábito</p>
                <button onClick={() => setMostrandoForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Emoji picker */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Elige un emoji</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS_PICKER.map((e) => (
                    <button
                      key={e}
                      onClick={() => setNuevoEmoji(e)}
                      className={cn(
                        "text-lg h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                        nuevoEmoji === e ? "bg-coral/20 ring-1 ring-coral/40" : "bg-surface-2 hover:bg-surface-2/80"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <input
                type="text"
                placeholder="Ej: Meditar 10 minutos"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCrearHabito(); }}
                maxLength={40}
                autoFocus
                className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-coral placeholder:text-muted-foreground"
              />

              <button
                onClick={handleCrearHabito}
                disabled={!nuevoNombre.trim() || guardandoNuevo}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-coral/10 text-coral border border-coral/30 text-sm font-semibold hover:bg-coral/20 transition-all disabled:opacity-50"
              >
                {guardandoNuevo ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Agregar hábito</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab Semana ──────────────────────────────────────────────── */}
      {tab === "semana" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Hábitos completados por día esta semana</p>

          {cargandoSemana ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {getSemanaActual().map((d) => {
                const isHoy = d === hoyISO();
                const count = semanaData[d] ?? 0;
                const hasDatos = count > 0;
                return (
                  <div key={d} className="flex flex-col items-center gap-2">
                    <span className={cn("text-xs font-medium", isHoy ? "text-teal" : "text-muted-foreground")}>
                      {diaLabel(d)}
                    </span>
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all",
                      isHoy && !hasDatos ? "border-teal/40 bg-teal/5" :
                      hasDatos ? "border-teal bg-teal/15" :
                      "border-border bg-surface"
                    )}>
                      {hasDatos ? (
                        <span className="text-sm font-bold text-teal">{count}</span>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </div>
                    {isHoy && (
                      <div className="h-1.5 w-1.5 rounded-full bg-teal" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-xs text-muted-foreground text-center">
              El número indica cuántos hábitos + ejercicios completaste ese día
            </p>
          </div>
        </div>
      )}

      {/* ─── Tab Gestionar ───────────────────────────────────────────── */}
      {tab === "gestionar" && (
        <div className="space-y-4">

          {/* Hábitos predefinidos */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Hábitos predefinidos
            </h3>
            <div className="space-y-2">
              {HABITOS_FIJOS.map((h) => (
                <div key={h.tipo} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface">
                  <span className="text-base">{h.emoji}</span>
                  <span className="text-sm text-foreground flex-1">{h.label}</span>
                  <span className="text-xs text-muted-foreground">Siempre activo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hábitos personalizados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Tus hábitos
              </h3>
              <button
                onClick={() => setMostrandoForm(!mostrandoForm)}
                className="flex items-center gap-1 text-xs text-coral hover:text-coral/80 transition-colors"
              >
                {mostrandoForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {mostrandoForm ? "Cancelar" : "Nuevo"}
              </button>
            </div>

            {/* Form nuevo hábito */}
            {mostrandoForm && (
              <div className="rounded-xl border border-coral/30 bg-surface p-4 space-y-4 mb-3 animate-fade-in">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Emoji</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS_PICKER.map((e) => (
                      <button
                        key={e}
                        onClick={() => setNuevoEmoji(e)}
                        className={cn(
                          "text-lg h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                          nuevoEmoji === e ? "bg-coral/20 ring-1 ring-coral/40" : "bg-surface-2 hover:bg-surface-2/80"
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Nombre del hábito"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCrearHabito(); }}
                  maxLength={40}
                  className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-coral placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleCrearHabito}
                  disabled={!nuevoNombre.trim() || guardandoNuevo}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-coral/10 text-coral border border-coral/30 text-sm font-semibold hover:bg-coral/20 transition-all disabled:opacity-50"
                >
                  {guardandoNuevo ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Agregar</>}
                </button>
              </div>
            )}

            {habitosDef.length === 0 && !mostrandoForm ? (
              <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Sin hábitos personalizados</p>
                <p className="text-xs text-muted-foreground">Toca "Nuevo" para agregar el primero</p>
              </div>
            ) : (
              <div className="space-y-2">
                {habitosDef.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface group">
                    <span className="text-base">{h.emoji}</span>
                    <span className="text-sm text-foreground flex-1">{h.nombre}</span>
                    <button
                      onClick={() => handleEliminarHabito(h.id)}
                      className="text-muted-foreground/0 group-hover:text-muted-foreground hover:text-coral transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

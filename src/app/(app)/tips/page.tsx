import { PushManager } from "@/components/notificaciones/push-manager";

export default function TipsPage() {
  return (
    <div className="animate-fade-in space-y-8">

      {/* Notificaciones */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Notificaciones</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Recordatorios para mantener tus hábitos cardiovasculares.
        </p>
        <PushManager />
      </div>

      {/* Tips — próximamente */}
      <div>
        <h2 className="text-xl font-bold mb-1">Tips Personalizados</h2>
        <p className="text-muted-foreground text-sm mb-4">Consejos para tu corazón basados en tu perfil.</p>
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-muted-foreground text-sm">
          🚧 Próximamente
        </div>
      </div>

    </div>
  );
}

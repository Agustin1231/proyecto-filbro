import { TipsClient } from "@/components/tips/tips-client";

export default function TipsPage() {
  return (
    <div className="animate-fade-in space-y-2">
      <h2 className="text-2xl font-bold mb-1">Tips de Salud</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Consejos personalizados y artículos para cuidar tu corazón.
      </p>
      <TipsClient />
    </div>
  );
}

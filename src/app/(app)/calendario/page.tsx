import { HabitosClient } from "@/components/habitos/habitos-client";

export default function CalendarioPage() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-1">Hábitos</h2>
      <p className="text-muted-foreground text-sm mb-6">Tu rutina diaria y seguimiento semanal.</p>
      <HabitosClient />
    </div>
  );
}

import { RecetasClient } from "@/components/recetas/recetas-client";

export default function RecetasPage() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-1">Asistente de Recetas</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Escribe tus ingredientes y la IA crea una receta cardioprotectora con foto del plato.
      </p>
      <RecetasClient />
    </div>
  );
}

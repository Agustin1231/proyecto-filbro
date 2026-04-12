import { RutinasClient } from "@/components/rutinas/rutinas-client";

export default function RutinasPage() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-1">Rutinas de Ejercicio</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Responde 4 preguntas y la IA genera tu rutina cardiovascular personalizada.
      </p>
      <RutinasClient />
    </div>
  );
}

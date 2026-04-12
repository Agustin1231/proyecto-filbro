import { ScoreClient } from "@/components/score/score-client";

export default function ScorePage() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-1">Mi Score Cardiovascular</h2>
      <p className="text-muted-foreground text-sm mb-6">Análisis de riesgo basado en tus métricas.</p>
      <ScoreClient />
    </div>
  );
}

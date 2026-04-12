import { DashboardClient } from "@/components/metricas/dashboard-client";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold">Mis Métricas</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Registra y analiza tu salud cardiovascular
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}

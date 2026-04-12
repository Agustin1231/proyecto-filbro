import { redirect } from "next/navigation";

// Redirige al onboarding — que decide si mostrar disclaimer o ir directo al dashboard
export default function RootPage() {
  redirect("/onboarding");
}

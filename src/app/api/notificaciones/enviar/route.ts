import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const { uid, title, body, url } = await req.json();

  if (!uid) return Response.json({ error: "uid requerido" }, { status: 400 });

  const { data: suscripciones } = await supabase
    .from("suscripciones_push")
    .select("*")
    .eq("uid", uid);

  if (!suscripciones?.length) {
    return Response.json({ error: "Sin suscripciones activas" }, { status: 404 });
  }

  const payload = JSON.stringify({
    title: title ?? "Pulso",
    body: body ?? "Tienes un recordatorio",
    url: url ?? "/dashboard",
  });

  const resultados = await Promise.allSettled(
    suscripciones.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys as { p256dh: string; auth: string } },
        payload
      )
    )
  );

  const enviados = resultados.filter((r) => r.status === "fulfilled").length;
  return Response.json({ ok: true, enviados });
}

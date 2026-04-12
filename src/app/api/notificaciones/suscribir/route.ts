import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { uid, subscription } = await req.json();

  if (!uid || !subscription?.endpoint) {
    return Response.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const { error } = await supabase
    .from("suscripciones_push")
    .upsert(
      { uid, endpoint: subscription.endpoint, keys: subscription.keys },
      { onConflict: "uid,endpoint" }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

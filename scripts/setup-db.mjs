/**
 * Pulso — Setup automático de base de datos Supabase
 *
 * Usa la Supabase Management API — no requiere conexión directa a PostgreSQL.
 *
 * Requiere en variables de entorno (Coolify):
 *   SUPABASE_ACCESS_TOKEN  → Supabase Dashboard → Account → Access Tokens → Generate new token
 *   NEXT_PUBLIC_SUPABASE_URL → ya la tienes configurada
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env.local solo en local (en Coolify las vars ya están en el entorno)
try {
  const { config } = await import("dotenv");
  config({ path: join(__dirname, "../.env.local") });
} catch { /* ignorar */ }

async function runQuery(projectRef, token, query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json();
}

async function main() {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken  = process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl || !accessToken) {
    if (!supabaseUrl)    console.warn("⚠️  NEXT_PUBLIC_SUPABASE_URL no definida.");
    if (!accessToken)    console.warn("⚠️  SUPABASE_ACCESS_TOKEN no definida — saltando setup de BD.");
    console.warn("   Agrega SUPABASE_ACCESS_TOKEN en Coolify → Environment Variables.");
    console.warn("   Lo encuentras en: supabase.com → Account → Access Tokens\n");
    process.exit(0);
  }

  // Extraer project ref de la URL: https://XXXX.supabase.co
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

  console.log("\n🗄️  Pulso — Setup de base de datos");
  console.log(`🔌  Conectando al proyecto: ${projectRef}\n`);

  try {
    // Verificar que la conexión funcione
    await runQuery(projectRef, accessToken, "SELECT 1");
    console.log("✅  Conexión exitosa.\n");
  } catch (err) {
    console.error(`❌  No se pudo conectar a Supabase: ${err.message}`);
    console.error("   Verifica que SUPABASE_ACCESS_TOKEN sea válido y tenga permisos.\n");
    process.exit(0);
  }

  const sql = readFileSync(join(__dirname, "../supabase_schema.sql"), "utf8");

  // Separar en sentencias individuales
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let created  = 0;
  let existing = 0;
  let warnings = 0;

  for (const stmt of statements) {
    try {
      await runQuery(projectRef, accessToken, stmt);
      created++;
    } catch (err) {
      const msg = err.message || "";
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate") ||
        msg.includes("42P07") ||
        msg.includes("42710") ||
        msg.includes("42P16")
      ) {
        existing++;
      } else {
        console.warn(`   ⚠️  ${msg.slice(0, 120)}`);
        warnings++;
      }
    }
  }

  console.log("📋  Resultado:");
  console.log(`   ✅ ${created} sentencias ejecutadas`);
  if (existing > 0) console.log(`   ℹ️  ${existing} objetos ya existían (normal en redeploys)`);
  if (warnings > 0) console.log(`   ⚠️  ${warnings} advertencias`);
  console.log("\n📦  Tablas disponibles:");
  console.log("   • metricas          • habitos");
  console.log("   • recetas_guardadas • rutinas");
  console.log("   • perfil_usuario");
  console.log("\n✅  Setup de base de datos completado.\n");
}

main().catch((err) => {
  console.error("❌  Error inesperado en setup-db:", err.message);
  process.exit(0); // No fallar el build
});

/**
 * Pulso — Setup automático de base de datos Supabase
 * Se ejecuta automáticamente en cada deploy (antes de next build).
 *
 * Requiere en variables de entorno (Coolify o .env.local):
 *   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
 *
 * La connection string la encuentras en:
 *   Supabase Dashboard → Settings → Database → Connection string → URI
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env.local solo en desarrollo (en Coolify las vars ya están en el entorno)
try {
  const { config } = await import("dotenv");
  config({ path: join(__dirname, "../.env.local") });
} catch {
  // dotenv no disponible — no pasa nada, usamos process.env directo
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;

  if (!dbUrl) {
    console.warn("⚠️  SUPABASE_DB_URL no definida — saltando setup de base de datos.");
    console.warn("   Agrega SUPABASE_DB_URL en las variables de entorno de Coolify.");
    console.warn("   La encuentras en: Supabase Dashboard → Settings → Database → Connection string → URI\n");
    process.exit(0); // No fallar el build
  }

  console.log("\n🗄️  Pulso — Setup de base de datos");
  console.log("🔌  Conectando a Supabase...\n");

  let pg;
  try {
    const module = await import("pg");
    pg = module.default;
  } catch {
    console.warn("⚠️  Paquete 'pg' no disponible — saltando setup de base de datos.\n");
    process.exit(0);
  }

  const { Client } = pg;
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("✅  Conexión exitosa.\n");

    const sql = readFileSync(join(__dirname, "../supabase_schema.sql"), "utf8");

    // Separar en sentencias individuales
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let created = 0;
    let existing = 0;
    let warnings = 0;

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        created++;
      } catch (err) {
        // Errores de "ya existe" — son normales después del primer deploy
        if (
          err.code === "42P07" || // tabla duplicada
          err.code === "42710" || // objeto duplicado
          err.code === "42P16" || // ya tiene RLS
          err.message?.includes("already exists")
        ) {
          existing++;
        } else {
          console.warn(`   ⚠️  ${err.message}`);
          warnings++;
        }
      }
    }

    console.log("📋  Resultado:");
    console.log(`   ✅ ${created} sentencias ejecutadas`);
    if (existing > 0) console.log(`   ℹ️  ${existing} objetos ya existían (normal en redeploys)`);
    if (warnings > 0) console.log(`   ⚠️  ${warnings} advertencias`);
    console.log("\n📦  Tablas disponibles:");
    console.log("   • metricas");
    console.log("   • habitos");
    console.log("   • recetas_guardadas");
    console.log("   • rutinas");
    console.log("   • perfil_usuario");
    console.log("\n✅  Setup de base de datos completado.\n");

  } catch (err) {
    // No fallar el build si hay un error de conexión
    console.error(`❌  Error en setup de BD: ${err.message}`);
    console.error("   La app desplegará igual pero revisa la conexión a Supabase.\n");
    process.exit(0);
  } finally {
    await client.end().catch(() => {});
  }
}

main();

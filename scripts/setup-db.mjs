/**
 * Pulso — Script de setup de base de datos Supabase
 *
 * Ejecutar con:
 *   node scripts/setup-db.mjs
 *
 * Requiere en .env.local:
 *   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
 *
 * La connection string la encuentras en:
 *   Supabase Dashboard → Settings → Database → Connection string → URI
 */

import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

const require = createRequire(import.meta.url);

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;

  if (!dbUrl) {
    console.error("❌  Falta SUPABASE_DB_URL en .env.local");
    console.error("   Encuéntrala en: Supabase Dashboard → Settings → Database → Connection string → URI");
    process.exit(1);
  }

  console.log("🔌  Conectando a Supabase...");

  let pg;
  try {
    pg = require("pg");
  } catch {
    console.error("❌  Falta el paquete 'pg'. Instálalo con: npm install pg --save-dev");
    process.exit(1);
  }

  const { Client } = pg;
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("✅  Conectado.");

    const sql = readFileSync(join(__dirname, "../supabase_schema.sql"), "utf8");

    // Ejecutar en bloques separados por ";" para mayor compatibilidad
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let ok = 0;
    let skip = 0;

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        ok++;
      } catch (err) {
        // Ignorar errores de "ya existe" (42P07 = tabla duplicada, 42710 = objeto duplicado)
        if (err.code === "42P07" || err.code === "42710" || err.message?.includes("already exists")) {
          skip++;
        } else {
          console.warn(`⚠️  ${err.message}`);
        }
      }
    }

    console.log(`\n✅  Setup completado.`);
    console.log(`   ${ok} sentencias ejecutadas, ${skip} ya existían.\n`);
    console.log("📋  Tablas creadas:");
    console.log("   • metricas");
    console.log("   • habitos");
    console.log("   • recetas_guardadas");
    console.log("   • rutinas");
    console.log("   • perfil_usuario\n");
  } catch (err) {
    console.error("❌  Error al conectar:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

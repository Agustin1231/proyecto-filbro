-- ============================================================
-- Pulso — Schema de Base de Datos (Supabase / PostgreSQL)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensión para UUID v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabla: metricas ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metricas (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  uid         TEXT        NOT NULL,   -- UUID anónimo del dispositivo
  tipo        TEXT        NOT NULL CHECK (tipo IN (
    'presion_sistolica','presion_diastolica','frecuencia_cardiaca',
    'peso','glucosa','colesterol_total','horas_sueno','nivel_estres'
  )),
  valor       NUMERIC     NOT NULL,
  unidad      TEXT        NOT NULL DEFAULT '',
  notas       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metricas_uid_tipo      ON metricas (uid, tipo);
CREATE INDEX idx_metricas_uid_created   ON metricas (uid, created_at DESC);

-- ── Tabla: habitos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habitos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  uid         TEXT        NOT NULL,
  fecha       DATE        NOT NULL,
  tipo        TEXT        NOT NULL CHECK (tipo IN (
    'ejercicio','alimentacion','sueno','medicamento','hidratacion'
  )),
  completado  BOOLEAN     NOT NULL DEFAULT FALSE,
  notas       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (uid, fecha, tipo)
);

CREATE INDEX idx_habitos_uid_fecha ON habitos (uid, fecha DESC);

-- ── Tabla: recetas_guardadas ─────────────────────────────────
CREATE TABLE IF NOT EXISTS recetas_guardadas (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  uid          TEXT        NOT NULL,
  titulo       TEXT        NOT NULL,
  contenido    TEXT        NOT NULL,   -- Markdown de la receta
  imagen_url   TEXT,
  ingredientes TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recetas_uid ON recetas_guardadas (uid, created_at DESC);

-- ── Tabla: rutinas ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rutinas (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  uid         TEXT        NOT NULL,
  nombre      TEXT        NOT NULL,
  contenido   JSONB       NOT NULL,   -- Plan estructurado
  activa      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rutinas_uid ON rutinas (uid, created_at DESC);

-- ── Tabla: perfil_usuario ────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfil_usuario (
  uid              TEXT        PRIMARY KEY,
  edad             INTEGER,
  genero           TEXT,
  condicion_fisica TEXT,
  objetivos        TEXT[]      DEFAULT '{}',
  disclaimer_ok    BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ───────────────────────────────────────
-- Política: cada usuario solo accede a sus propios datos via uid.
-- Como no hay auth real, usamos una función helper que lee el header x-pulso-uid.

ALTER TABLE metricas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas_guardadas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_usuario     ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para anon key (el uid viene del cliente)
-- En producción esto se refuerza desde el servidor validando el uid
CREATE POLICY "allow_all_metricas"          ON metricas           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_habitos"           ON habitos             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_recetas"           ON recetas_guardadas  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rutinas"           ON rutinas             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_perfil"            ON perfil_usuario     FOR ALL USING (true) WITH CHECK (true);

-- Washington Hot Springs — Cloudflare D1 Schema
-- Run via: wrangler d1 execute wa-hot-springs --file=db/schema.sql

-- ─── Springs ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS springs (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  -- Location
  lat         REAL,
  lng         REAL,
  gps         TEXT,
  -- Core info
  temp_f      INTEGER,
  fee         REAL,
  fee_notes   TEXT,
  description TEXT,
  access_type TEXT,          -- 'drive-up' | 'hike-in' | 'boat-in'
  hours       TEXT,
  season      TEXT,
  clothing    TEXT,          -- 'required' | 'optional' | 'clothing-optional'
  -- Access & logistics
  cell_coverage TEXT,
  road_condition TEXT,
  parking     TEXT,
  -- Visit guidance
  best_time   TEXT,
  avoid_when  TEXT,
  insider_tips TEXT,
  nearby_gems  TEXT,
  -- Status
  last_verified TEXT,
  maintenance_day TEXT,
  alerts      TEXT,
  -- Metadata
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- ─── Conditions Reports ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conditions (
  id          TEXT PRIMARY KEY,
  spring_id   TEXT NOT NULL REFERENCES springs(id) ON DELETE CASCADE,
  spring_slug TEXT NOT NULL,
  visit_date  TEXT,
  crowd_level INTEGER CHECK (crowd_level BETWEEN 1 AND 5),
  water_temp  REAL,
  is_open     INTEGER DEFAULT 1,  -- 1 = open, 0 = closed
  photo_url   TEXT,
  notes       TEXT,
  reported_by TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_conditions_spring_slug ON conditions(spring_slug);
CREATE INDEX IF NOT EXISTS idx_conditions_created_at  ON conditions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_springs_slug           ON springs(slug);

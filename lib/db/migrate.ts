// lib/db/migrate.ts
// Run with: npx tsx lib/db/migrate.ts
// Or paste this SQL directly in Vercel Postgres → Query tab

import { sql } from "@vercel/postgres";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS progress (
  id              SERIAL PRIMARY KEY,
  grade           VARCHAR(20),
  subject         VARCHAR(50),
  chapter_title   VARCHAR(200),
  score           INT     DEFAULT 0,
  total_questions INT     DEFAULT 1,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_grade   ON progress(grade);
CREATE INDEX IF NOT EXISTS idx_progress_subject ON progress(subject);
`;

// ── Also provide the raw SQL so you can paste into Vercel dashboard ───────────
export const MIGRATION_SQL = SCHEMA;

async function migrate() {
  if (!process.env.POSTGRES_URL) {
    console.log("No POSTGRES_URL set — paste this SQL in Vercel Postgres → Query tab:\n");
    console.log(SCHEMA);
    return;
  }
  try {
    await sql.query(SCHEMA);
    console.log("✅ Database tables created!");
  } catch (err) {
    console.error("❌ Migration error:", err);
  }
}

migrate();

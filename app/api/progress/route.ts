import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// POST /api/progress  — save a session
// GET  /api/progress?uid=xxx — fetch last 20 sessions
export async function POST(req: NextRequest) {
  try {
    const { grade, subject, chapterTitle, score = 0, totalQuestions = 1 } = await req.json();

    // Vercel Postgres is only available when POSTGRES_URL env var is set
    // If not set (local dev / free Vercel without DB), silently skip
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ saved: false, reason: "No database configured — that's fine!" });
    }

    await sql`
      INSERT INTO progress (grade, subject, chapter_title, score, total_questions, created_at)
      VALUES (${grade}, ${subject}, ${chapterTitle ?? ""}, ${score}, ${totalQuestions}, NOW())
    `;

    return NextResponse.json({ saved: true });
  } catch (err: unknown) {
    // Never crash the app if analytics fail
    console.warn("[/api/progress] skipped:", err instanceof Error ? err.message : err);
    return NextResponse.json({ saved: false });
  }
}

export async function GET(req: NextRequest) {
  if (!process.env.POSTGRES_URL) {
    return NextResponse.json({ progress: [] });
  }
  try {
    const { rows } = await sql`
      SELECT grade, subject, chapter_title, score, total_questions, created_at
      FROM progress
      ORDER BY created_at DESC
      LIMIT 20
    `;
    return NextResponse.json({ progress: rows });
  } catch (err) {
    return NextResponse.json({ progress: [], error: String(err) });
  }
}

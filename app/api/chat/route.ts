import { NextRequest, NextResponse } from "next/server";

// ─── Gemini config ────────────────────────────────────────────────────────────
// GEMINI_API_KEY is a SERVER-ONLY env var (no NEXT_PUBLIC_ prefix)
// Vercel never ships it to the browser — completely safe
const KEY   = process.env.GEMINI_API_KEY ?? "";
const MODEL = "gemini-2.0-flash";
const URL_  = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

const AGES: Record<string, string> = {
  "Grade 3": "8-9", "Grade 4": "9-10", "Grade 5": "10-11",
};

// ─── Helper: one Gemini call ──────────────────────────────────────────────────
async function gemini(body: object): Promise<string> {
  if (!KEY) throw new Error("GEMINI_API_KEY is not set in Vercel environment variables.");
  const res  = await fetch(URL_, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    // Next.js fetch cache — don't cache AI responses
    cache:   "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(`Gemini API: ${data.error.message}`);
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

// ─── System prompt ────────────────────────────────────────────────────────────
function sysPrompt(grade: string, subject: string, ctx = "") {
  return `You are "Buddy" 🦉 — the MOST fun, caring, encouraging AI tutor for ${grade} students (ages ${AGES[grade] ?? "9-10"})!

PERSONALITY:
• Wildly enthusiastic and warm — like a cool elder sibling who LOVES teaching
• Use emojis frequently 🌟✨🎉🔥
• Give RELATABLE real-world Indian examples: cricket, Bollywood, chai, mangoes, biryani, auto-rickshaws, PUBG, Minecraft, WhatsApp
• Short funny jokes or silly comparisons to make hard things click
• Celebrate correct answers: "WAHHHH! 🎉 You're a GENIUS!" / "YESSS! My star student! 🌟"
• If wrong: "Ooh, close! Even Einstein got things wrong! Let me show you a magic trick 🪄"
• If confused: "No problem at all! Let's try a DIFFERENT way 🔄"

SUBJECT: ${subject} | GRADE: ${grade}
CHAPTER: ${ctx || "Textbook chapter"}

STRICT RULES:
• Max 120 words per reply (step-by-step max 200 words)
• Use "WE/US": "Let's figure this out TOGETHER 🤝"
• ALWAYS end with a fun follow-up question OR "Ready for something even cooler? 🎮"
• Break into tiny steps — never dump everything at once
• Never use jargon without a plain-English explanation right after
• Quiz format — place on its own line with NO surrounding text:
  QUIZ:{"q":"question text","opts":["Option A","Option B","Option C"],"ans":"Option A"}`;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Basic rate-limit via Vercel Edge headers (falls back gracefully)
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  console.log(`[/api/chat] ${new Date().toISOString()} ip=${ip}`);

  try {
    const { type, grade, subject, imageBase64, imageMime, history, chapterCtx } = await req.json();

    // ── START: analyse image → chapter context → opening lesson ───────────
    if (type === "start") {
      // 1. Extract chapter metadata
      const extracted = await gemini({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: imageMime, data: imageBase64 } },
            { text: `Analyse this textbook page. Respond ONLY as valid JSON with NO markdown backticks:
{"title":"...","concepts":["...","...","..."],"summary":"one sentence max"}` },
          ],
        }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
      });

      let info = { title: "Your Chapter", concepts: [] as string[], summary: "" };
      try { info = JSON.parse(extracted.replace(/```json|```/g, "").trim()); } catch {}
      const ctx = `${info.title}: ${info.summary}. Key concepts: ${info.concepts.join(", ")}`;

      // 2. Generate fun opening lesson
      const welcome = await gemini({
        system_instruction: { parts: [{ text:
          `You are Buddy 🦉 — super fun tutor for ${grade} kids.
Subject: ${subject} | Chapter: ${ctx}
Start EXACTLY with: "Hey there, SUPER LEARNER! 🦉✨"
Introduce the chapter in 100 words max. ONE funny Indian example (cricket/chai/biryani/auto).
End with ONE engaging question!` }] },
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: imageMime, data: imageBase64 } },
            { text: "Start the lesson!" },
          ],
        }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.9 },
      });

      return NextResponse.json({ text: welcome, chapterCtx: ctx });
    }

    // ── CHAT: multi-turn conversation ──────────────────────────────────────
    if (type === "chat") {
      const geminiHistory = ((history as Array<{role:string;content:string}>) ?? []).map(m => ({
        role:  m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const rawText = await gemini({
        system_instruction: { parts: [{ text: sysPrompt(grade, subject, chapterCtx) }] },
        contents: geminiHistory,
        generationConfig: { maxOutputTokens: 600, temperature: 0.9 },
      });

      // Parse optional QUIZ block
      let quiz = null;
      let text = rawText;
      const qm  = rawText.match(/QUIZ:\{"q":"[^"]+","opts":\[[^\]]+\],"ans":"[^"]+"\}/);
      if (qm) {
        try {
          const p = JSON.parse(qm[0].replace("QUIZ:", ""));
          quiz = { question: p.q, options: p.opts, correct: p.ans };
          text = rawText.replace(qm[0], "").trim();
        } catch {}
      }

      return NextResponse.json({ text, quiz });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

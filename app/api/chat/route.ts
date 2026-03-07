import { NextRequest, NextResponse } from "next/server";

const KEY   = process.env.GEMINI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";
const URL_  = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

const AGES: Record<string, string> = {
  "Grade 3": "8-9", "Grade 4": "9-10", "Grade 5": "10-11",
};

async function gemini(body: object): Promise<string> {
  if (!KEY) throw new Error("GEMINI_API_KEY is not set in Vercel environment variables.");
  const res  = await fetch(URL_, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    cache:   "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(`Gemini API: ${data.error.message}`);
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}

// ── Strip markdown/emojis so TTS sounds clean ─────────────────────────────────
function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[•\-]\s/g, "")
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[🌟✨🎉🔥🦉🧠💫⭐🎯🌍🔢🔬📝🌿🏏☕🍛😅🥳😕🔄]/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── CHAT MODE prompt ──────────────────────────────────────────────────────────
function chatPrompt(grade: string, subject: string, ctx: string) {
  const age = AGES[grade] ?? "9-10";
  return `You are BUDDY, a brilliant and caring tutor for ${grade} students aged ${age}.
You have already READ and ANALYSED the chapter: "${ctx}"
You know this chapter completely. Always refer back to it naturally.

TEACHING METHOD (research-backed):
- Always activate prior knowledge first: ask what they already know
- Use concrete Indian examples: cricket, chai, biryani, auto-rickshaws, IPL, monsoon
- Show a worked example yourself before asking them to try
- Use Socratic questions: guide to the answer, don't just give it
- Praise effort not intelligence (Dweck 2006)
- Never say "wrong" — say "close! here's a tiny clue..."
- After every explanation ask ONE question to check understanding
- Use "we" language: "let's figure this out together"

RESPONSE RULES:
- Max 80 words per reply
- Always end with exactly one question
- Use emojis for energy 🌟✨🎉
- Short paragraphs only, never walls of text
- Reference the chapter content naturally in your answers

QUIZ FORMAT (use occasionally to test understanding):
QUIZ:{"q":"question","opts":["A","B","C"],"ans":"A"}`;
}

// ── VOICE MODE prompt — sounds like a real human conversation ─────────────────
function voicePrompt(grade: string, subject: string, ctx: string) {
  const age = AGES[grade] ?? "9-10";
  return `You are BUDDY, talking out loud with a ${grade} student aged ${age} years old.
You have ALREADY READ the chapter from their textbook. The chapter is about: "${ctx}"
You know this chapter completely. Refer to it naturally in conversation.

YOU ARE SPEAKING, NOT WRITING. A text-to-speech engine will read your words aloud.

SOUND LIKE A REAL PERSON:
- Use contractions always: "it's", "don't", "you're", "can't", "that's", "let's", "I've"
- Use thinking sounds: "So...", "Hmm, okay...", "Oh wait, here's the thing...", "Right, so..."
- Use excitement naturally: "Oh this is actually so cool!", "Wait till you hear this!"
- Use casual connectors: "And the crazy part is...", "But here's what's wild...", "So basically..."
- Ask questions conversationally: "Does that make sense?", "Right?", "You with me so far?"
- Use "like" and "actually" naturally: "It's actually really simple", "Think of it like..."
- Pause for effect with "..." in your text — the TTS will pause there

STRICT FORMAT RULES (or TTS will sound robotic):
- MAXIMUM 2 short sentences then ask a question — this is a back-and-forth conversation
- ZERO markdown: no asterisks, no dashes, no bullet points, no headers
- NO lists — say "first... then... and finally..." not "1. 2. 3."
- NO emojis — they get read aloud as "sparkles" or "fire" which sounds terrible
- Write numbers as words: "three" not "3", "first" not "1."
- Keep total response under 40 words — you want them to respond, not just listen

TEACHING METHOD:
- Always use Indian examples they know: cricket shots, making chai, biryani layers, auto rides
- Guide with questions, don't lecture
- Celebrate effort: "Yes! You got there yourself, that's brilliant!"
- If confused: "No worries at all, let me try a different way..."
- Reference what's actually IN the chapter you read

QUIZ FORMAT (text mode only, skip in voice):
QUIZ:{"q":"question","opts":["A","B","C"],"ans":"A"}`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      type, grade, subject,
      imageBase64, imageMime,
      history, chapterCtx,
      voiceMode = false,
    } = await req.json();

    // ── START: read image → get chapter context → opening message ─────────
    if (type === "start") {

      // Step 1: extract chapter info from the actual image
      const extracted = await gemini({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: imageMime, data: imageBase64 } },
            { text: `You are analysing a student's textbook page. Read it carefully.
Extract the information and respond ONLY as valid JSON with NO markdown backticks:
{"title":"chapter title","concepts":["concept 1","concept 2","concept 3"],"summary":"one clear sentence describing what this chapter teaches","keyFacts":["important fact 1","important fact 2","important fact 3"]}` },
          ],
        }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.1 },
      });

      let info = { title: "Your Chapter", concepts: [] as string[], summary: "", keyFacts: [] as string[] };
      try {
        info = JSON.parse(extracted.replace(/```json|```/g, "").trim());
      } catch {
        // If JSON parse fails, use raw text as summary
        info.summary = extracted.slice(0, 200);
      }

      const ctx = `${info.title}. Summary: ${info.summary}. Key concepts: ${info.concepts.join(", ")}. Key facts: ${info.keyFacts.join(". ")}`;

      // Step 2: generate opening — include the image so Gemini sees it directly
      const openingSystem = voiceMode
        ? `${voicePrompt(grade, subject, ctx)}
You are starting a NEW voice conversation with this student.
Greet them warmly in ONE casual sentence. Then ask them ONE thing they already know about this topic.
Sound like a friend, not a teacher. Under 30 words total. No emojis.`
        : `${chatPrompt(grade, subject, ctx)}
Start with "Hey there, SUPER LEARNER! 🦉✨"
Use the Activate Prior Knowledge method. One Indian example. Under 80 words.`;

      const welcome = await gemini({
        system_instruction: { parts: [{ text: openingSystem }] },
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: imageMime, data: imageBase64 } },
            { text: "Start the lesson." },
          ],
        }],
        generationConfig: { maxOutputTokens: voiceMode ? 100 : 300, temperature: 0.88 },
      });

      const text = voiceMode ? cleanForSpeech(welcome) : welcome;
      return NextResponse.json({ text, chapterCtx: ctx });
    }

    // ── CHAT: multi-turn conversation ──────────────────────────────────────
    if (type === "chat") {
      const systemText = voiceMode
        ? voicePrompt(grade, subject, chapterCtx || "the chapter from the textbook")
        : chatPrompt(grade, subject, chapterCtx || "the chapter from the textbook");

      const geminiHistory = ((history as Array<{ role: string; content: string }>) ?? []).map(m => ({
        role:  m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const rawText = await gemini({
        system_instruction: { parts: [{ text: systemText }] },
        contents: geminiHistory,
        generationConfig: {
          maxOutputTokens: voiceMode ? 120 : 500,
          temperature: 0.9,
        },
      });

      // Parse quiz block (text mode only)
      let quiz = null;
      let text = rawText;
      if (!voiceMode) {
        const qm = rawText.match(/QUIZ:\{"q":"[^"]+","opts":\[[^\]]+\],"ans":"[^"]+"\}/);
        if (qm) {
          try {
            const p = JSON.parse(qm[0].replace("QUIZ:", ""));
            quiz = { question: p.q, options: p.opts, correct: p.ans };
            text = rawText.replace(qm[0], "").trim();
          } catch {}
        }
      }

      const finalText = voiceMode ? cleanForSpeech(text) : text;
      return NextResponse.json({ text: finalText, quiz });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

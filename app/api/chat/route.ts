import { NextRequest, NextResponse } from "next/server";

const KEY   = process.env.GEMINI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";
const URL_  = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

const AGES: Record<string, string> = {
  "Grade 3": "8-9", "Grade 4": "9-10", "Grade 5": "10-11",
};

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH FOUNDATION (all methods used in system prompt below)
//
// • Bloom's Taxonomy (1956, revised Anderson & Krathwohl 2001)
//   Remember → Understand → Apply → Analyse → Evaluate → Create
// • Vygotsky Zone of Proximal Development (1978) — teach at the learning edge
// • Sweller Cognitive Load Theory (1988) — one concept at a time
// • Roediger & Karpicke Retrieval Practice (Science, 2006) — testing > re-reading
// • Dweck Growth Mindset (2006) — praise effort not ability, "not yet" language
// • Singapore CPA Method — Concrete → Pictorial → Abstract always
// • Elaborative Interrogation (Pressley et al. 1992) — ask "why" not just "what"
// • Worked Examples Effect (Atkinson et al. 2000) — show before asking to do
// • Hattie Visible Learning (2009) — feedback effect size 0.73, metacognition 0.69
// • Spaced Repetition (Ebbinghaus) — revisit earlier concepts naturally
// • Socratic Questioning (Paul & Elder 2006) — guide discovery, never just tell
// • Mastery Learning (Bloom 1984) — don't advance until 80%+ mastery
// • Dual Coding Theory (Paivio 1971) — pair words with vivid mental images
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(grade: string, subject: string, ctx = "", voiceMode = false) {
  const age = AGES[grade] ?? "9-10";

  const formatRules = voiceMode ? `
VOICE CONVERSATION MODE — MANDATORY FORMAT RULES:
- You are speaking OUT LOUD. A text-to-speech engine reads your words.
- ABSOLUTELY NO markdown: no **bold**, no bullet points, no # headers, no dashes
- Write EXACTLY as natural spoken English
- MAX 2-3 short sentences per turn — this is a dialogue, not a lecture
- Use natural filler words: "So here's the thing...", "Okay, so...", "Now this is cool..."
- Say numbers as words: "two" not "2", "first" not "1."
- Never say "Here are the steps" — say "First... then... finally..."
- Pause indicators: use "..." for a thinking pause
- After EVERY response, ask exactly ONE short question to keep the conversation going
- Sound like a real person talking, not a textbook
` : `
TEXT CHAT MODE:
- Use emojis to show energy 🌟✨🎉🔥
- Short paragraphs only — never walls of text
- Max 100 words per response
- Always end with one question
`;

  return `You are BUDDY — a world-class conversational AI tutor for ${grade} students aged ${age}.

YOUR TEACHING IDENTITY
You teach using the most effective methods proven by decades of learning science research.
You are warm, funny, endlessly patient — like a brilliant older cousin who makes everything click.
You use INDIAN real-world examples every single time: cricket, chai, biryani, Diwali, 
auto-rickshaws, IPL matches, monsoon rain, WhatsApp, PUBG, train journeys, mango season.

THE BUDDY TEACHING METHOD — follow this sequence for every new concept:

ONE: ACTIVATE PRIOR KNOWLEDGE FIRST (Ausubel 1960)
Before teaching anything, ask what the child already knows or thinks.
Example: "Before I explain this, what do YOU think happens when...?"
This is not optional. It primes the brain and shows you where to start.

TWO: CONCRETE ANCHOR (Singapore CPA Method)
Always begin with something physical and real that a child aged ${age} has experienced.
Never introduce abstract concepts without a concrete foundation first.
Wrong: "Photosynthesis is the process by which plants convert light to energy."
Right: "You know how you feel hungry and tired if you skip lunch? Plants have the same problem — they need food too. Guess how they eat?"

THREE: WORKED EXAMPLE (Atkinson 2000 — reduces cognitive load)
Walk through one complete example yourself, thinking aloud like a detective.
"Let me show you how I think through this... first I notice... then I ask myself..."
Do this BEFORE asking the child to try anything.

FOUR: GUIDED DISCOVERY (Socratic Method — Paul & Elder 2006)
Ask a sequence of questions that lead the child toward the answer themselves.
Never give the answer directly if a guiding question can get them there.
"So if plants need energy and they can not eat food... where else could energy come from?"

FIVE: RETRIEVAL PRACTICE (Roediger & Karpicke, Science 2006 — doubles retention)
After every concept: "Close your eyes for a second... now explain this back to me in your own words."
This is the single most powerful learning technique ever discovered.

SIX: ADAPTIVE DIFFICULTY
If child answers correctly first time → add one layer of complexity immediately.
If child is confused after two attempts → completely change your approach:
  Switch to a totally different analogy from a different domain.
  Break into even smaller steps.
  Return to pure concrete before any abstraction.

SEVEN: GROWTH MINDSET RESPONSES (Dweck 2006)
When correct: Celebrate the EFFORT not the result. "You kept thinking it through — that persistence is what champions do!"
When wrong: NEVER say wrong or incorrect. Say "Ooh your brain is in the right neighbourhood, just one street away! Here is a tiny clue..."
Always use "not yet" language. Mistakes are evidence of learning, celebrate them.

EIGHT: BLOOM'S TAXONOMY PROGRESSION
Start at Remember level, push toward higher levels as confidence grows.
Remember: "What is the name of...?"
Understand: "Explain this in your own words."
Apply: "How would you use this if...?"
Analyse: "Why do you think this happens?"
Evaluate: "Do you agree with this? Why?"
Create: "Can you make up your own example?"

NINE: METACOGNITIVE CHECK (Hattie 2009 — effect size 0.69)
Periodically ask: "On a scale of one to ten, how confident do you feel?"
This builds self-monitoring — the number one predictor of academic success.

TEN: SPACED CONNECTIONS
Reference earlier parts of the conversation naturally.
"Remember that cricket example? This new concept actually works the same way!"

QUIZ FORMAT — use only when you want to check understanding:
Place this on its own line with no other text around it:
QUIZ:{"q":"question text","opts":["Option A","Option B","Option C"],"ans":"Option A"}
Make quizzes test UNDERSTANDING not memorisation.
Bad: "What is photosynthesis?" 
Good: "If you put a plant in a dark cupboard for a week, what would happen and why?"

SUBJECT: ${subject}
GRADE: ${grade} — Age: ${age} years
CHAPTER CONTEXT: ${ctx || "Textbook chapter"}

${formatRules}

FINAL PRINCIPLE: You are not an encyclopedia. You are a thinking partner.
The child should be doing at least 40% of the talking.
Every response from you should end with a question that makes the child think.
Guide. Question. Celebrate. Adapt. Never lecture.`;
}

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

export async function POST(req: NextRequest) {
  try {
    const {
      type, grade, subject,
      imageBase64, imageMime,
      history, chapterCtx,
      voiceMode = false,
    } = await req.json();

    if (type === "start") {
      // Step 1: extract chapter info
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

      // Step 2: opening lesson using Buddy Method
      const openingInstruction = voiceMode
        ? `Greet the child warmly in 2 sentences max. Then ask them one question about what they already know about this topic. Sound like a real person talking, not a teacher. No lists, no emojis, pure conversational speech.`
        : `Start with "Hey there, SUPER LEARNER! 🦉✨". Use the Activate Prior Knowledge method — ask what they already know. One Indian example. 80 words max.`;

      const welcome = await gemini({
        system_instruction: { parts: [{ text: buildSystemPrompt(grade, subject, ctx, voiceMode) }] },
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: imageMime, data: imageBase64 } },
            { text: openingInstruction },
          ],
        }],
        generationConfig: { maxOutputTokens: voiceMode ? 120 : 350, temperature: 0.85 },
      });

      return NextResponse.json({ text: cleanForVoice(welcome, voiceMode), chapterCtx: ctx });
    }

    if (type === "chat") {
      const geminiHistory = ((history as Array<{ role: string; content: string }>) ?? []).map(m => ({
        role:  m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const rawText = await gemini({
        system_instruction: { parts: [{ text: buildSystemPrompt(grade, subject, chapterCtx, voiceMode) }] },
        contents: geminiHistory,
        generationConfig: { maxOutputTokens: voiceMode ? 180 : 550, temperature: 0.9 },
      });

      let quiz = null;
      let text = rawText;
      const qm = rawText.match(/QUIZ:\{"q":"[^"]+","opts":\[[^\]]+\],"ans":"[^"]+"\}/);
      if (qm) {
        try {
          const p = JSON.parse(qm[0].replace("QUIZ:", ""));
          quiz = { question: p.q, options: p.opts, correct: p.ans };
          text = rawText.replace(qm[0], "").trim();
        } catch {}
      }

      return NextResponse.json({ text: cleanForVoice(text, voiceMode), quiz });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Strip markdown and emojis for text-to-speech
function cleanForVoice(text: string, voiceMode: boolean): string {
  if (!voiceMode) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[•\-]\s/g, "")
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[🌟✨🎉🔥🦉🧠💫⭐🎯🌍🔢🔬📝🌿]/g, "")
    .replace(/\n{2,}/g, " ")
    .trim();
}

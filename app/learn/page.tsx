"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter }     from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast             from "react-hot-toast";
import { useTutorStore } from "@/lib/store";
import BuddyAvatar       from "@/components/BuddyAvatar";
import ChatBubble, { type Message } from "@/components/ChatBubble";
import QuickReplies      from "@/components/QuickReplies";
import StarBurst         from "@/components/StarBurst";

const GC: Record<string, { bg:string; light:string; accent:string; dark:string }> = {
  "Grade 3": { bg:"#FF6B6B", light:"#FFF0F0", accent:"#C0392B", dark:"#922B21" },
  "Grade 4": { bg:"#2ECC71", light:"#EAFAF1", accent:"#1A8A4A", dark:"#117A3C" },
  "Grade 5": { bg:"#A29BFE", light:"#F0EFFE", accent:"#5E4FC4", dark:"#3D2F9E" },
};

type Mood = "idle"|"thinking"|"happy"|"excited"|"wrong";

export default function LearnPage() {
  const router = useRouter();
  const { grade, subject, image, chapterCtx, setChapterCtx, clearSession } = useTutorStore();
  const [messages,   setMsgs]      = useState<Message[]>([]);
  const [input,      setInput]     = useState("");
  const [loading,    setLoading]   = useState(false);
  const [mood,       setMood]      = useState<Mood>("idle");
  const [celebrate,  setCelebrate] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const gc = GC[grade] ?? GC["Grade 4"];

  // Redirect home if no image uploaded
  useEffect(() => {
    if (!image) { router.replace("/"); return; }
    startLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:"smooth" });
  }, [messages, loading]);

  // ── call our own Next.js API route ─────────────────────────────────────────
  const callAPI = async (body: object) => {
    const res = await fetch("/api/chat", {
      method:  "POST",
      headers: { "Content-Type":"application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  };

  // ── Start lesson (analyse image → opening message) ─────────────────────────
  const startLesson = async () => {
    setLoading(true); setMood("thinking");
    try {
      const data = await callAPI({
        type: "start", grade, subject,
        imageBase64: image!.base64,
        imageMime:   image!.mime,
      });
      if (data.chapterCtx) setChapterCtx(data.chapterCtx);
      setMsgs([{ id:Date.now(), role:"ai", content:data.text, mood:"excited", typing:true }]);
      setMood("happy");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
      setMsgs([{ id:Date.now(), role:"ai",
        content:`❌ ${msg}\n\nCheck that GEMINI_API_KEY is set in Vercel env vars!`,
        mood:"wrong" }]);
    }
    setLoading(false);
  };

  // ── Send chat message ───────────────────────────────────────────────────────
  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id:Date.now(), role:"user", content:text };
    const next = [...messages, userMsg];
    setMsgs(next); setInput(""); setLoading(true); setMood("thinking");

    try {
      const history = next.map(m => ({
        role:    m.role==="ai" ? "model" : "user",
        content: m.content,
      }));
      const data = await callAPI({ type:"chat", grade, subject, history, chapterCtx });
      const msgId = Date.now() + 1;

      setMsgs(prev => [...prev, {
        id: msgId, role:"ai", content:data.text,
        mood:"happy", typing:true,
        ...(data.quiz ? {
          quiz:     data.quiz,
          answered: null,
          onAnswer: (ans: string) => handleAnswer(msgId, ans, data.quiz.correct),
        } : {}),
      }]);
      setMood("happy");

      // Save progress silently (fire-and-forget)
      if (data.quiz) {
        fetch("/api/progress", {
          method:  "POST",
          headers: { "Content-Type":"application/json" },
          body:    JSON.stringify({ grade, subject, chapterTitle: chapterCtx }),
        }).catch(() => {});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown";
      setMsgs(prev => [...prev, { id:Date.now()+1, role:"ai",
        content:`Oops! ${msg} 😅 Try again!`, mood:"wrong" }]);
    }
    setLoading(false);
  };

  // ── Quiz answer handler ─────────────────────────────────────────────────────
  const handleAnswer = (msgId: number, chosen: string, correct: string) => {
    setMsgs(prev => prev.map(m => m.id===msgId ? { ...m, answered:chosen } : m));
    const right = chosen===correct;
    setMood(right ? "excited" : "idle");
    if (right) { setCelebrate(true); setTimeout(() => setCelebrate(false), 1500); }
    setTimeout(() => {
      setMsgs(prev => [...prev, {
        id: Date.now()+99, role:"ai", typing:true,
        mood: right ? "excited" : "idle",
        content: right
          ? `🎉 WAHHHH! "${chosen}" is CORRECT! You're a STAR! 🌟 Ready for something cooler? 🔥`
          : `Ooh nice try! The answer is "${correct}" 🪄 Want me to explain it? 🤝`,
      }]);
    }, 400);
  };

  return (
    <main className="max-w-[430px] mx-auto h-screen flex flex-col overflow-hidden relative"
      style={{ background:"#f0effc" }}>
      {celebrate && <StarBurst />}

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{
        background:`linear-gradient(135deg,${gc.bg},${gc.dark})`,
        padding:"14px 18px", display:"flex", alignItems:"center", gap:12,
        boxShadow:`0 3px 16px ${gc.bg}55`, flexShrink:0,
      }}>
        <button onClick={() => { clearSession(); router.replace("/"); }} style={{
          background:"rgba(255,255,255,0.25)", border:"none",
          borderRadius:50, width:36, height:36,
          color:"#fff", fontSize:20, cursor:"pointer", fontWeight:900,
        }}>←</button>
        <BuddyAvatar mood={mood} size={46} pulse={loading} />
        <div>
          <p style={{ color:"#fff", fontFamily:"var(--font-fredoka)", fontSize:20, lineHeight:1.2 }}>
            Buddy 🦉
          </p>
          <p style={{ color:"rgba(255,255,255,0.88)", fontSize:12, fontWeight:700 }}>
            {loading ? "Thinking hard... 🤔" : `${grade} · ${subject} · Ready! ✨`}
          </p>
        </div>
        <div style={{ marginLeft:"auto", background:"rgba(255,255,255,0.2)",
          borderRadius:50, padding:"4px 12px" }}>
          <p style={{ color:"#fff", fontSize:11, fontWeight:800 }}>⚡ Free · Gemini</p>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 pb-2">
        {loading && messages.length===0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <BuddyAvatar mood="thinking" size={80} pulse />
            <p style={{ fontFamily:"var(--font-fredoka)", fontSize:19, color:gc.accent }}>
              Reading your chapter... 📖
            </p>
            <p className="text-sm text-center max-w-[220px]" style={{ color:"#aaa" }}>
              Getting SO excited to teach you this! 🌟
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.2 }}>
              <ChatBubble msg={msg} gc={gc} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading dots */}
        {loading && messages.length>0 && (
          <div className="flex items-end gap-2 mb-3">
            <BuddyAvatar mood="thinking" size={34} pulse />
            <div className="flex gap-1 px-3 py-3 bg-white rounded-tl-sm rounded-3xl shadow-sm">
              {[0,1,2].map(i => (
                <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#b2bec3",
                  animation:`dotUp 1.1s ${i*0.18}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Replies ─────────────────────────────────────────── */}
      {messages.length>0 && !loading && <QuickReplies gc={gc} onSelect={send} />}

      {/* ── Input bar ────────────────────────────────────────────── */}
      <div className="px-3 pb-5 pt-2 bg-white border-t border-gray-100 flex gap-2 items-end"
        style={{ flexShrink:0 }}>
        <input value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && send(input)}
          placeholder="Ask Buddy anything! 🦉"
          disabled={loading}
          style={{
            flex:1, padding:"12px 16px", borderRadius:50,
            border:`2.5px solid ${input ? gc.bg : "#e0e0e0"}`,
            outline:"none", fontSize:14,
            fontFamily:"var(--font-nunito)", fontWeight:600,
            background:"#fafafa", color:"#2d3436",
            transition:"border-color 0.2s",
          }}
        />
        <motion.button whileTap={{ scale:0.9 }}
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            width:46, height:46, borderRadius:"50%", border:"none",
            background: input.trim() ? `linear-gradient(135deg,${gc.bg},${gc.dark})` : "#e0e0e0",
            color:"#fff", fontSize:20,
            cursor: input.trim() ? "pointer" : "not-allowed",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow: input.trim() ? `0 4px 14px ${gc.bg}55` : "none",
            flexShrink:0, transition:"all 0.2s",
          }}>🚀</motion.button>
      </div>
    </main>
  );
}

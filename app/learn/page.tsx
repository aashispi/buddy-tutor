"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useTutorStore } from "@/lib/store";
import BuddyAvatar from "@/components/BuddyAvatar";
import ChatBubble, { type Message } from "@/components/ChatBubble";
import QuickReplies from "@/components/QuickReplies";
import StarBurst from "@/components/StarBurst";

const GC: Record<string, { bg: string; light: string; accent: string; dark: string }> = {
  "Grade 3": { bg: "#FF6B6B", light: "#FFF0F0", accent: "#C0392B", dark: "#922B21" },
  "Grade 4": { bg: "#2ECC71", light: "#EAFAF1", accent: "#1A8A4A", dark: "#117A3C" },
  "Grade 5": { bg: "#A29BFE", light: "#F0EFFE", accent: "#5E4FC4", dark: "#3D2F9E" },
};

type Mood = "idle" | "thinking" | "happy" | "excited" | "wrong" | "speaking" | "listening";
type ViewMode = "chat" | "voice";

// ─── Voice Orb ────────────────────────────────────────────────────────────────
function VoiceOrb({
  state,
  gc,
  onPress,
  onRelease,
}: {
  state: "idle" | "listening" | "thinking" | "speaking";
  gc: { bg: string; accent: string; dark: string };
  onPress: () => void;
  onRelease: () => void;
}) {
  const pulseColor = {
    idle:      gc.bg,
    listening: "#e74c3c",
    thinking:  "#f39c12",
    speaking:  gc.bg,
  }[state];

  const label = {
    idle:      "Hold to speak",
    listening: "Listening...",
    thinking:  "Buddy is thinking...",
    speaking:  "Buddy is talking",
  }[state];

  const emoji = {
    idle:      "🎤",
    listening: "👂",
    thinking:  "🤔",
    speaking:  "🦉",
  }[state];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 20,
      padding: "32px 20px",
      position: "relative",
    }}>
      {/* Ripple rings */}
      {(state === "listening" || state === "speaking") && [1, 2, 3].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: 120 + i * 50,
          height: 120 + i * 50,
          borderRadius: "50%",
          border: `2px solid ${pulseColor}`,
          opacity: 0,
          animation: `ripple 2s ${i * 0.4}s ease-out infinite`,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }} />
      ))}

      {/* Main orb button */}
      <motion.button
        onPointerDown={onPress}
        onPointerUp={onRelease}
        onPointerLeave={onRelease}
        whileTap={{ scale: 0.93 }}
        style={{
          width: 140, height: 140,
          borderRadius: "50%", border: "none",
          background:
            state === "listening" ? "linear-gradient(135deg,#e74c3c,#c0392b)" :
            state === "thinking"  ? "linear-gradient(135deg,#f39c12,#e67e22)" :
            `linear-gradient(135deg,${gc.bg},${gc.dark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 52, cursor: "pointer",
          boxShadow: `0 8px 40px ${pulseColor}66`,
          transition: "background 0.3s, box-shadow 0.3s",
          animation: state === "speaking" ? "bob 0.6s ease-in-out infinite alternate" : "none",
          position: "relative", zIndex: 2,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {emoji}
      </motion.button>

      <p style={{
        fontFamily: "var(--font-fredoka)",
        fontSize: 20, color: gc.accent, letterSpacing: 0.5,
      }}>
        {label}
      </p>

      {state === "idle" && (
        <p style={{
          fontSize: 13, color: "#aaa", fontWeight: 600,
          textAlign: "center", maxWidth: 220,
        }}>
          Press and hold, then speak. Release when done.
        </p>
      )}

      {/* Sound wave bars */}
      {(state === "listening" || state === "speaking") && (
        <div style={{ display: "flex", gap: 5, alignItems: "center", height: 40 }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{
              width: 5, borderRadius: 3,
              background: pulseColor,
              animation: `soundBar 0.8s ${i * 0.09}s ease-in-out infinite alternate`,
              height: `${12 + Math.abs(Math.sin(i)) * 22}px`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Voice transcript bubble ───────────────────────────────────────────────────
function TranscriptBubble({
  text, role, gc,
}: {
  text: string;
  role: "user" | "ai";
  gc: { bg: string; accent: string; dark: string };
}) {
  const isAI = role === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: isAI ? "row" : "row-reverse",
        gap: 10, marginBottom: 14,
        alignItems: "flex-end",
      }}
    >
      {isAI && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg,#ffeaa7,#fdcb6e)",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16, flexShrink: 0,
        }}>🦉</div>
      )}
      <div style={{
        maxWidth: "80%", padding: "10px 14px",
        borderRadius: isAI ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isAI ? "white" : `linear-gradient(135deg,${gc.bg},${gc.dark})`,
        color: isAI ? "#2d3436" : "white",
        fontSize: 14, fontWeight: 600, lineHeight: 1.5,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        fontFamily: "var(--font-nunito)",
      }}>
        {text}
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const router = useRouter();
  const { grade, subject, image, chapterCtx, setChapterCtx, clearSession } = useTutorStore();

  // Shared
  const [messages,  setMsgs]      = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [mood,      setMood]      = useState<Mood>("idle");
  const [celebrate, setCelebrate] = useState(false);
  const [viewMode,  setViewMode]  = useState<ViewMode>("chat");

  // Chat
  const [input, setInput] = useState("");

  // Voice
  const [voiceState,   setVoiceState]   = useState<"idle"|"listening"|"thinking"|"speaking">("idle");
  const [transcript,   setTranscript]   = useState("");
  const [voiceHistory, setVoiceHistory] = useState<Array<{ role:"user"|"ai"; text:string }>>([]);
  const [voiceReady,   setVoiceReady]   = useState(false);
  const [voiceStarted, setVoiceStarted] = useState(false);

  // Refs
  const chatRef       = useRef<HTMLDivElement>(null);
  const voiceRef      = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognRef     = useRef<any>(null);
  const isListening   = useRef(false);
  const transcriptRef = useRef(""); // ← fixes stale closure bug

  const gc = GC[grade] ?? GC["Grade 4"];

  // Redirect if no image
  useEffect(() => {
    if (!image) { router.replace("/"); return; }
    startLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check Web Speech API support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const hasSTT = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    const hasTTS = !!w.speechSynthesis;
    setVoiceReady(hasSTT && hasTTS);
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    voiceRef.current?.scrollTo({ top: voiceRef.current.scrollHeight, behavior: "smooth" });
  }, [voiceHistory, transcript]);

  // ── API helper ──────────────────────────────────────────────────────────────
  const callAPI = useCallback(async (body: object) => {
    const res  = await fetch("/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }, []);

  // ── Start lesson (chat mode) ────────────────────────────────────────────────
  const startLesson = async () => {
    setLoading(true); setMood("thinking");
    try {
      const data = await callAPI({
        type: "start", grade, subject,
        imageBase64: image!.base64,
        imageMime:   image!.mime,
        voiceMode:   false,
      });
      if (data.chapterCtx) setChapterCtx(data.chapterCtx);
      setMsgs([{ id: Date.now(), role: "ai", content: data.text, mood: "excited", typing: true }]);
      setMood("happy");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
      setMsgs([{ id: Date.now(), role: "ai", content: `❌ ${msg}`, mood: "wrong" }]);
    }
    setLoading(false);
  };

  // ── Send chat message ───────────────────────────────────────────────────────
  const sendChat = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMsgs(next); setInput(""); setLoading(true); setMood("thinking");

    try {
      const history = next.map(m => ({
        role:    m.role === "ai" ? "model" : "user",
        content: m.content,
      }));
      const data = await callAPI({ type: "chat", grade, subject, history, chapterCtx, voiceMode: false });
      const msgId = Date.now() + 1;

      setMsgs(prev => [...prev, {
        id: msgId, role: "ai", content: data.text,
        mood: "happy", typing: true,
        ...(data.quiz ? {
          quiz: data.quiz, answered: null,
          onAnswer: (ans: string) => handleAnswer(msgId, ans, data.quiz.correct),
        } : {}),
      }]);
      setMood("happy");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setMsgs(prev => [...prev, {
        id: Date.now() + 1, role: "ai",
        content: `Oops! ${msg} 😅 Try again!`, mood: "wrong",
      }]);
    }
    setLoading(false);
  };

  // ── Quiz answer ─────────────────────────────────────────────────────────────
  const handleAnswer = (msgId: number, chosen: string, correct: string) => {
    setMsgs(prev => prev.map(m => m.id === msgId ? { ...m, answered: chosen } : m));
    const right = chosen === correct;
    setMood(right ? "excited" : "idle");
    if (right) { setCelebrate(true); setTimeout(() => setCelebrate(false), 1500); }
    setTimeout(() => {
      setMsgs(prev => [...prev, {
        id: Date.now() + 99, role: "ai", typing: true,
        mood: right ? "excited" : "idle",
        content: right
          ? `🎉 YES! "${chosen}" — correct! You kept thinking it through — that's exactly how champions learn! Ready for the next level? 🔥`
          : `Ooh, your brain is so close! The answer is "${correct}" — want me to explain it with a fun example? 🤝`,
      }]);
    }, 400);
  };

  // ── Text to Speech ──────────────────────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const synth = (window as any).speechSynthesis;
    if (!synth) return;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Wait for voices to load (needed on some Android Chrome)
    const assignVoiceAndSpeak = () => {
      const voices = synth.getVoices();
      const preferred =
        voices.find((v: SpeechSynthesisVoice) => v.lang === "en-IN") ||
        voices.find((v: SpeechSynthesisVoice) => v.name.includes("Google")) ||
        voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith("en")) ||
        voices[0];
      if (preferred) utterance.voice = preferred;

      utterance.rate   = 0.92;
      utterance.pitch  = 1.1;
      utterance.volume = 1.0;

      utterance.onstart = () => { setVoiceState("speaking"); setMood("speaking"); };
      utterance.onend   = () => { setVoiceState("idle");     setMood("happy");    };
      utterance.onerror = () => { setVoiceState("idle");     setMood("idle");     };

      synth.speak(utterance);
    };

    if (synth.getVoices().length > 0) {
      assignVoiceAndSpeak();
    } else {
      synth.onvoiceschanged = assignVoiceAndSpeak;
    }
  }, []);

  // ── Send voice message to Gemini ────────────────────────────────────────────
  const sendVoiceMessage = useCallback(async (spokenText: string) => {
    if (!spokenText.trim()) { setVoiceState("idle"); return; }
    setVoiceState("thinking"); setMood("thinking");

    setVoiceHistory(prev => [...prev, { role: "user", text: spokenText }]);

    try {
      // Build history from voice transcript for context
      const history = voiceHistory.map(h => ({
        role:    h.role === "ai" ? "model" : "user",
        content: h.text,
      }));
      history.push({ role: "user", content: spokenText });

      const data = await callAPI({
        type: "chat", grade, subject,
        history, chapterCtx, voiceMode: true,
      });

      const replyText = data.text || "Sorry, I couldn't get a response. Try again!";
      setVoiceHistory(prev => [...prev, { role: "ai", text: replyText }]);

      // Also sync to chat view
      setMsgs(prev => [
        ...prev,
        { id: Date.now() - 1, role: "user", content: spokenText },
        { id: Date.now(),     role: "ai",   content: replyText, mood: "happy" },
      ]);

      speakText(replyText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      console.error("[voice]", msg);
      setVoiceState("idle"); setMood("idle");
      speakText("Sorry, I had a little hiccup. Can you try again?");
    }
  }, [voiceHistory, grade, subject, chapterCtx, callAPI, speakText]);

  // ── Start listening (hold button) ───────────────────────────────────────────
  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!voiceReady || voiceState !== "idle") return;

    // Stop any ongoing speech
    w.speechSynthesis?.cancel();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Use Chrome on Android or desktop.");
      return;
    }

    const recog = new SpeechRecognition();
    recognRef.current = recog;

    recog.continuous     = false;
    recog.interimResults = true;
    recog.lang           = "en-IN";

    recog.onstart = () => {
      isListening.current   = true;
      transcriptRef.current = "";
      setTranscript("");
      setVoiceState("listening");
      setMood("listening");
    };

    recog.onresult = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const t = Array.from(e.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join("");
      transcriptRef.current = t; // ← write to ref, not just state
      setTranscript(t);
    };

    recog.onend = () => {
      isListening.current = false;
      const final = transcriptRef.current; // ← read from ref (always latest value)
      transcriptRef.current = "";
      setTranscript("");

      if (final.trim()) {
        sendVoiceMessage(final.trim());
      } else {
        setVoiceState("idle");
        setMood("idle");
      }
    };

    recog.onerror = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("[speech recognition error]", e.error);
      isListening.current = false;
      transcriptRef.current = "";
      setTranscript("");
      setVoiceState("idle");
      setMood("idle");
      if (e.error === "not-allowed") {
        toast.error("Microphone blocked! Allow mic access in your browser settings.");
      }
    };

    try {
      recog.start();
    } catch {
      setVoiceState("idle");
    }
  }, [voiceReady, voiceState, sendVoiceMessage]);

  // ── Stop listening (release button) ────────────────────────────────────────
  const stopListening = useCallback(() => {
    isListening.current = false;
    recognRef.current?.stop();
  }, []);

  // ── Init voice mode ─────────────────────────────────────────────────────────
  const initVoiceMode = useCallback(async () => {
    if (voiceStarted) return;
    setVoiceStarted(true);
    setVoiceState("thinking"); setMood("thinking");

    try {
      const data = await callAPI({
        type: "start", grade, subject,
        imageBase64: image!.base64,
        imageMime:   image!.mime,
        voiceMode:   true,
      });
      const welcome = data.text || "Hey there! I'm Buddy. Hold the button and tell me what you already know about this chapter!";
      if (data.chapterCtx) setChapterCtx(data.chapterCtx);
      setVoiceHistory([{ role: "ai", text: welcome }]);
      // Small delay so voices list loads on Android
      setTimeout(() => speakText(welcome), 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setVoiceState("idle"); setMood("idle");
      toast.error(msg);
    }
  }, [voiceStarted, grade, subject, image, callAPI, setChapterCtx, speakText]);

  const switchToVoice = () => {
    setViewMode("voice");
    initVoiceMode();
  };

  const switchToChat = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).speechSynthesis?.cancel();
    recognRef.current?.stop();
    setVoiceState("idle");
    setViewMode("chat");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main
      className="max-w-[430px] mx-auto h-screen flex flex-col overflow-hidden relative"
      style={{ background: "#f0effc" }}
    >
      {celebrate && <StarBurst />}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg,${gc.bg},${gc.dark})`,
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: `0 3px 16px ${gc.bg}55`,
        flexShrink: 0,
      }}>
        <button
          onClick={() => { clearSession(); router.replace("/"); }}
          style={{
            background: "rgba(255,255,255,0.25)", border: "none",
            borderRadius: 50, width: 36, height: 36,
            color: "#fff", fontSize: 20, cursor: "pointer", fontWeight: 900,
          }}
        >←</button>

        <BuddyAvatar
          mood={mood}
          size={46}
          pulse={loading || voiceState === "thinking" || voiceState === "speaking"}
        />

        <div style={{ flex: 1 }}>
          <p style={{ color: "#fff", fontFamily: "var(--font-fredoka)", fontSize: 20, lineHeight: 1.2 }}>
            Buddy 🦉
          </p>
          <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
            {loading || voiceState === "thinking" ? "Thinking... 🤔"
              : voiceState === "listening" ? "Listening... 👂"
              : voiceState === "speaking"  ? "Speaking... 🗣️"
              : `${grade} · ${subject} · Ready!`}
          </p>
        </div>

        {/* Chat / Voice toggle */}
        <div style={{
          display: "flex", gap: 4,
          background: "rgba(255,255,255,0.2)",
          borderRadius: 50, padding: 4,
        }}>
          <button onClick={switchToChat} style={{
            padding: "5px 11px", borderRadius: 50, border: "none",
            background: viewMode === "chat" ? "white" : "transparent",
            color: viewMode === "chat" ? gc.accent : "white",
            fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all 0.2s",
          }}>💬 Chat</button>
          <button onClick={switchToVoice} style={{
            padding: "5px 11px", borderRadius: 50, border: "none",
            background: viewMode === "voice" ? "white" : "transparent",
            color: viewMode === "voice" ? gc.accent : "white",
            fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all 0.2s",
          }}>🎤 Voice</button>
        </div>
      </div>

      {/* ══ CHAT VIEW ═══════════════════════════════════════════ */}
      {viewMode === "chat" && (
        <>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 pb-2">
            {loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <BuddyAvatar mood="thinking" size={80} pulse />
                <p style={{ fontFamily: "var(--font-fredoka)", fontSize: 19, color: gc.accent }}>
                  Reading your chapter... 📖
                </p>
                <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", maxWidth: 220 }}>
                  Getting ready to teach you! 🌟
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChatBubble msg={msg} gc={gc} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading dots */}
            {loading && messages.length > 0 && (
              <div className="flex items-end gap-2 mb-3">
                <BuddyAvatar mood="thinking" size={34} pulse />
                <div className="flex gap-1 px-3 py-3 bg-white rounded-3xl shadow-sm">
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%", background: "#b2bec3",
                      animation: `dotUp 1.1s ${i * 0.18}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {messages.length > 0 && !loading && (
            <QuickReplies gc={gc} onSelect={sendChat} />
          )}

          <div
            className="px-3 pb-5 pt-2 bg-white border-t border-gray-100 flex gap-2 items-end"
            style={{ flexShrink: 0 }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat(input)}
              placeholder="Type anything or switch to 🎤 Voice..."
              disabled={loading}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 50,
                border: `2.5px solid ${input ? gc.bg : "#e0e0e0"}`,
                outline: "none", fontSize: 14,
                fontFamily: "var(--font-nunito)", fontWeight: 600,
                background: "#fafafa", color: "#2d3436",
                transition: "border-color 0.2s",
              }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendChat(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 46, height: 46, borderRadius: "50%", border: "none",
                background: input.trim()
                  ? `linear-gradient(135deg,${gc.bg},${gc.dark})`
                  : "#e0e0e0",
                color: "#fff", fontSize: 20,
                cursor: input.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: input.trim() ? `0 4px 14px ${gc.bg}55` : "none",
                flexShrink: 0, transition: "all 0.2s",
              }}
            >🚀</motion.button>
          </div>
        </>
      )}

      {/* ══ VOICE VIEW ══════════════════════════════════════════ */}
      {viewMode === "voice" && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Transcript scroll area */}
          <div ref={voiceRef} style={{
            flex: 1, overflowY: "auto",
            padding: "16px 14px 8px",
            background: "#f0effc",
          }}>
            {voiceHistory.length === 0 && voiceState === "thinking" && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <BuddyAvatar mood="thinking" size={72} pulse />
                <p style={{ fontFamily: "var(--font-fredoka)", fontSize: 18, color: gc.accent }}>
                  Getting ready to talk... 🎤
                </p>
              </div>
            )}

            {voiceHistory.map((h, i) => (
              <TranscriptBubble key={i} text={h.text} role={h.role} gc={gc} />
            ))}

            {/* Live transcript preview while user is speaking */}
            {transcript !== "" && (
              <TranscriptBubble text={transcript + "..."} role="user" gc={gc} />
            )}
          </div>

          {/* Orb + controls */}
          <div style={{
            background: "white",
            borderTop: "1px solid #eee",
            display: "flex", flexDirection: "column",
            alignItems: "center", paddingBottom: 16,
            flexShrink: 0,
          }}>
            {!voiceReady ? (
              <div style={{ padding: 20, textAlign: "center" }}>
                <p style={{ color: "#e74c3c", fontWeight: 700, fontSize: 14 }}>
                  ⚠️ Voice not supported in this browser
                </p>
                <p style={{ color: "#aaa", fontSize: 12, marginTop: 6 }}>
                  Please open this app in <strong>Chrome</strong> on Android or desktop
                </p>
              </div>
            ) : (
              <VoiceOrb
                state={voiceState}
                gc={gc}
                onPress={startListening}
                onRelease={stopListening}
              />
            )}

            <p style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginTop: 4 }}>
              Switch to 💬 Chat to type instead
            </p>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes ripple {
          0%   { transform: translate(-50%,-50%) scale(0.8); opacity: 0.6; }
          100% { transform: translate(-50%,-50%) scale(2.0); opacity: 0;   }
        }
        @keyframes soundBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1.0); }
        }
      `}</style>
    </main>
  );
}

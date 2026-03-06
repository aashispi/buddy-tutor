"use client";
import { useState, useRef } from "react";
import { useRouter }        from "next/navigation";
import { motion }           from "framer-motion";
import { useTutorStore }    from "@/lib/store";
import PWAInstallBanner     from "@/components/PWAInstallBanner";

const GRADES   = ["Grade 3", "Grade 4", "Grade 5"] as const;
const SUBJECTS = [
  { id: "Math",            emoji: "🔢" },
  { id: "Science",         emoji: "🔬" },
  { id: "English",         emoji: "📝" },
  { id: "Social Studies",  emoji: "🌍" },
  { id: "EVS",             emoji: "🌿" },
] as const;

const GC: Record<string, { bg:string; light:string; accent:string; dark:string }> = {
  "Grade 3": { bg:"#FF6B6B", light:"#FFF0F0", accent:"#C0392B", dark:"#922B21" },
  "Grade 4": { bg:"#2ECC71", light:"#EAFAF1", accent:"#1A8A4A", dark:"#117A3C" },
  "Grade 5": { bg:"#A29BFE", light:"#F0EFFE", accent:"#5E4FC4", dark:"#3D2F9E" },
};

export default function HomePage() {
  const router   = useRouter();
  const { grade, subject, setGrade, setSubject, setImage } = useTutorStore();
  const [preview,  setPreview]  = useState<string|null>(null);
  const [imgReady, setImgReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const gc = GC[grade];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate size — max 4MB (Gemini inline limit)
    if (file.size > 4 * 1024 * 1024) {
      alert("Image too large! Please use a photo under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      setImage({ base64: result.split(",")[1], mime: file.type, previewUrl: result });
      setImgReady(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="max-w-[430px] mx-auto min-h-screen flex flex-col overflow-x-hidden"
      style={{ background:"#f5f4ff" }}>
      <PWAInstallBanner />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }}
        style={{
          background:`linear-gradient(140deg,${gc.bg} 0%,${gc.dark} 100%)`,
          borderRadius:"0 0 48px 48px",
          padding:"48px 24px 36px",
          textAlign:"center", color:"#fff",
          boxShadow:`0 8px 32px ${gc.bg}55`,
        }}>
        <div className="text-7xl mb-3 inline-block animate-wiggle select-none">🦉</div>
        <h1 className="font-fredoka text-4xl tracking-wide mb-1">Buddy Tutor</h1>
        <p className="text-base font-bold opacity-90">Your smartest study pal — ever! 🌟</p>

        {/* Cost badge */}
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {["⚡ Gemini AI", "🇮🇳 Indian examples", "🎉 100% Free"].map(f => (
            <span key={f} style={{ background:"rgba(255,255,255,0.22)", borderRadius:50,
              padding:"4px 12px", fontSize:12, fontWeight:700 }}>{f}</span>
          ))}
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-5 pb-10">

        {/* ── Grade ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <p className="font-fredoka text-lg mb-3" style={{ color:"#636e72" }}>📚 What&apos;s your grade?</p>
          <div className="flex gap-3 mb-6">
            {GRADES.map(g => {
              const s = GC[g]; const active = grade===g;
              return (
                <button key={g} onClick={() => setGrade(g)} style={{
                  flex:1, padding:"13px 4px", borderRadius:18,
                  border:`3px solid ${active ? s.bg : "#e0e0e0"}`,
                  background: active ? s.light : "#fff",
                  color: active ? s.accent : "#bbb",
                  fontWeight:800, fontSize:13, cursor:"pointer",
                  fontFamily:"var(--font-nunito)", transition:"all 0.2s",
                  transform: active ? "scale(1.07)" : "scale(1)",
                  boxShadow: active ? `0 4px 14px ${s.bg}44` : "none",
                }}>
                  {g.replace("Grade ","Gr.")} {g==="Grade 3"?"🔴":g==="Grade 4"?"🟢":"🟣"}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Subject ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
          <p className="font-fredoka text-lg mb-3" style={{ color:"#636e72" }}>🎯 Pick your subject</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {SUBJECTS.map(s => {
              const active = subject===s.id;
              return (
                <button key={s.id} onClick={() => setSubject(s.id)} style={{
                  padding:"9px 15px", borderRadius:50,
                  border:`2.5px solid ${active ? gc.bg : "#e0e0e0"}`,
                  background: active ? gc.light : "#fff",
                  color: active ? gc.accent : "#bbb",
                  fontWeight:800, fontSize:13, cursor:"pointer",
                  fontFamily:"var(--font-nunito)", transition:"all 0.2s",
                }}>
                  {s.emoji} {s.id}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Upload ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <p className="font-fredoka text-lg mb-3" style={{ color:"#636e72" }}>📷 Upload your chapter</p>
          <div onClick={() => fileRef.current?.click()} style={{
            border:`3px dashed ${preview ? gc.bg : "#ccc"}`,
            borderRadius:24, padding:24, textAlign:"center",
            cursor:"pointer", transition:"all 0.3s", marginBottom:20,
            background: preview ? gc.light : "#fafafa",
          }}>
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="chapter" style={{ maxWidth:"100%", maxHeight:180,
                  borderRadius:14, marginBottom:10, objectFit:"contain" }} />
                <p style={{ color:gc.accent, fontWeight:800, fontSize:14 }}>
                  ✅ Chapter uploaded! Tap to change
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">📷</div>
                <p className="font-bold text-base" style={{ color:"#555" }}>Snap your chapter page!</p>
                <p className="text-sm mt-1" style={{ color:"#bbb" }}>
                  Photo or screenshot of your textbook · Max 4MB
                </p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFile} />
        </motion.div>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <motion.button whileTap={{ scale:0.97 }}
          onClick={() => imgReady && router.push("/learn")}
          disabled={!imgReady}
          style={{
            width:"100%", padding:"18px", borderRadius:22, border:"none",
            background: imgReady ? `linear-gradient(135deg,${gc.bg},${gc.dark})` : "#e0e0e0",
            color: imgReady ? "#fff" : "#ccc",
            fontFamily:"var(--font-fredoka)", fontSize:22,
            cursor: imgReady ? "pointer" : "not-allowed",
            boxShadow: imgReady ? `0 8px 28px ${gc.bg}55` : "none",
            transition:"all 0.3s", letterSpacing:0.5,
          }}>
          {imgReady ? "🚀 Start Learning with Buddy!" : "📷 Upload a chapter first!"}
        </motion.button>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mt-5 justify-center">
          {["🧠 Step-by-step","🎯 Fun quizzes","🏏 Indian examples",
            "🔄 Never gives up","🎉 Celebrates you","📱 Works offline"].map(f => (
            <span key={f} style={{ background:"#fff", border:`1.5px solid ${gc.bg}44`,
              color:gc.accent, borderRadius:50, padding:"5px 12px",
              fontSize:11, fontWeight:700 }}>{f}</span>
          ))}
        </div>

        {/* Zero cost badge */}
        <div className="mt-6 animate-fadeIn" style={{
          background:"linear-gradient(135deg,#00b894,#00cec9)",
          borderRadius:18, padding:"14px 18px", textAlign:"center",
        }}>
          <p className="font-fredoka text-white text-lg">💸 ₹0/month until you scale</p>
          <p className="text-white text-xs font-bold mt-1 opacity-90">
            Vercel free tier + Gemini free tier = zero infra cost for 200 sessions/month
          </p>
        </div>
      </div>
    </main>
  );
}

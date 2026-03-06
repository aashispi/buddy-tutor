"use client";
import { useState, useEffect, useRef } from "react";
import BuddyAvatar from "./BuddyAvatar";

export interface Quiz    { question:string; options:string[]; correct:string; }
export interface Message {
  id:       number;
  role:     "ai"|"user";
  content:  string;
  mood?:    string;
  typing?:  boolean;
  quiz?:    Quiz;
  answered?:string|null;
  onAnswer?:(ans:string) => void;
}
interface GC { bg:string; light:string; accent:string; dark:string; }

function TypingText({ text, speed=14 }: { text:string; speed?:number }) {
  const [shown, setShown] = useState("");
  const [done,  setDone]  = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    setShown(""); setDone(false); idx.current=0;
    if (!text) return;
    const iv = setInterval(() => {
      idx.current++;
      setShown(text.slice(0, idx.current));
      if (idx.current >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{shown}{!done && <span className="cursor">▋</span>}</span>;
}

export default function ChatBubble({ msg, gc }: { msg:Message; gc:GC }) {
  const ai = msg.role==="ai";
  return (
    <div style={{ display:"flex", flexDirection: ai?"row":"row-reverse",
      alignItems:"flex-end", gap:8, marginBottom:13 }}>
      {ai && <BuddyAvatar mood={msg.mood??"idle"} size={34} />}
      <div style={{
        maxWidth:"79%", padding:"11px 15px",
        borderRadius: ai ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
        background: ai ? "#fff" : `linear-gradient(135deg,${gc.bg},${gc.accent})`,
        color: ai ? "#2d3436" : "#fff",
        fontSize:14, lineHeight:1.6, fontWeight: ai ? 600 : 700,
        boxShadow:"0 2px 8px rgba(0,0,0,0.09)",
        fontFamily:"var(--font-nunito)", whiteSpace:"pre-wrap", wordBreak:"break-word",
      }}>
        {msg.typing ? <TypingText text={msg.content} /> : msg.content}

        {msg.quiz && (
          <div style={{ marginTop:10 }}>
            <p style={{ fontSize:13, fontWeight:800, marginBottom:8, color:gc.accent }}>
              {msg.quiz.question}
            </p>
            {msg.quiz.options.map((opt, i) => {
              const chosen   = msg.answered===opt;
              const correct  = opt===msg.quiz!.correct;
              const revealed = !!msg.answered;
              return (
                <button key={i} disabled={!!msg.answered}
                  onClick={() => !msg.answered && msg.onAnswer?.(opt)}
                  style={{
                    display:"block", width:"100%", margin:"5px 0",
                    padding:"8px 12px", borderRadius:10, textAlign:"left",
                    border:`2px solid ${revealed?(correct?"#00b894":chosen?"#d63031":"#eee"):gc.bg}`,
                    background: revealed?(correct?"#00b89422":chosen?"#d6303122":"#fafafa"):"#fafafa",
                    color: revealed?(correct?"#00b894":chosen?"#d63031":"#999"):gc.accent,
                    fontWeight:700, fontSize:13,
                    cursor: msg.answered ? "default" : "pointer",
                    fontFamily:"var(--font-nunito)", transition:"all 0.2s",
                  }}>
                  {String.fromCharCode(65+i)}. {opt}
                  {revealed && correct && " ✅"}
                  {revealed && chosen && !correct && " ❌"}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

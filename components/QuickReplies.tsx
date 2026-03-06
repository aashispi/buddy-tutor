// ─── QuickReplies ──────────────────────────────────────────────────────────────
"use client";
export function QuickReplies({ gc, onSelect }: { gc:{bg:string;accent:string}; onSelect:(t:string)=>void }) {
  const REPLIES = [
    "I don't get it 😕","Give an example! 🌍",
    "Quiz me! 🎯","Say it differently 🔄",
    "Tell me more ✨","How to remember this? 🧠",
  ];
  return (
    <div style={{ padding:"7px 12px 4px", overflowX:"auto", display:"flex",
      gap:8, background:"#f0effc", flexShrink:0, scrollbarWidth:"none" }}>
      {REPLIES.map(r => (
        <button key={r} onClick={() => onSelect(r)} style={{
          whiteSpace:"nowrap", padding:"7px 13px", borderRadius:50,
          border:`2px solid ${gc.bg}`, background:"#fff", color:gc.accent,
          fontSize:12, fontWeight:800, cursor:"pointer",
          fontFamily:"var(--font-nunito)",
        }}>{r}</button>
      ))}
    </div>
  );
}
export default QuickReplies;

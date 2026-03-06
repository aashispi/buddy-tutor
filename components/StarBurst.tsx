export default function StarBurst() {
  const STARS = ["⭐","🌟","✨","💫","🎉","🥳","🔥"];
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:99 }}>
      {STARS.map((s,i) => (
        <span key={i} style={{
          position:"absolute", left:`${8+i*13}%`, top:`${18+Math.sin(i)*15}%`,
          fontSize:22+i*3,
          animation:`starFly 1.3s ${i*0.1}s ease-out forwards`,
          opacity:0,
        }}>{s}</span>
      ))}
    </div>
  );
}

const MOODS: Record<string, string> = {
  idle:"🦉", thinking:"🤔", happy:"🥳", excited:"🎉", wrong:"😅", question:"🧐",
};
interface Props { mood: string; size?: number; pulse?: boolean; }

export default function BuddyAvatar({ mood, size=44, pulse }: Props) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:"linear-gradient(135deg,#ffeaa7,#fdcb6e)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.48, border:"3px solid #fff",
      boxShadow:"0 3px 14px rgba(0,0,0,0.14)", flexShrink:0,
      animation: pulse ? "bob 0.7s ease-in-out infinite alternate" : "none",
      userSelect:"none",
    }}>
      {MOODS[mood] ?? "🦉"}
    </div>
  );
}

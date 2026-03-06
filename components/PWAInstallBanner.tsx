"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome:"accepted"|"dismissed" }>;
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent|null>(null);
  const [show,   setShow]   = useState(false);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="pwa-banner"
          initial={{ y:80, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:80, opacity:0 }}
          style={{ background:"#fff", borderRadius:20, padding:"14px 16px",
            boxShadow:"0 8px 32px rgba(0,0,0,0.16)",
            display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:36 }}>🦉</div>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:800, fontSize:14, color:"#2d3436" }}>Add Buddy to Home Screen!</p>
            <p style={{ fontSize:12, color:"#aaa", fontWeight:600 }}>Works offline too 📲</p>
          </div>
          <button onClick={install} style={{
            background:"linear-gradient(135deg,#2ECC71,#117A3C)",
            color:"#fff", border:"none", borderRadius:12,
            padding:"8px 14px", fontWeight:800, fontSize:13,
            cursor:"pointer", fontFamily:"var(--font-nunito)",
          }}>Install</button>
          <button onClick={() => setShow(false)} style={{
            background:"none", border:"none", color:"#bbb", fontSize:18, cursor:"pointer",
          }}>✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState } from "react";
import { C, OWNER_EMAIL } from "../utils/constants";
import { Card, Btn, GoldDivider } from "../components/UI";

export default function HeroPage({ onContinue }) {
  const [email, setEmail] = useState("");
  const [err,   setErr]   = useState("");

  const go = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { setErr("Enter a valid email address."); return; }
    setErr("");
    onContinue(trimmed);
  };

  return (
    <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "56px 24px 80px" }}>
      {/* Logo bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>📊</div>
          <span style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700, color: C.white }}>
            CA NoteMap AI
          </span>
        </div>
        <span style={{
          background: `${C.gold}15`, border: `1px solid ${C.gold}30`,
          borderRadius: 6, padding: "3px 12px", fontSize: 11,
          fontWeight: 700, color: C.gold, letterSpacing: "0.4px",
        }}>ICAI SPECIALIZED</span>
      </div>

      {/* Hero */}
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 64 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: `${C.gold}12`, border: `1px solid ${C.gold}30`,
          borderRadius: 99, padding: "5px 18px", marginBottom: 28,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: C.gold,
            display: "inline-block", animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{ color: C.gold, fontSize: 11, fontWeight: 800, letterSpacing: "0.8px" }}>
            AI STUDY ASSISTANT FOR CHARTERED ACCOUNTANCY
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-head)",
          fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 800,
          margin: "0 0 20px", color: C.white, lineHeight: 1.1, letterSpacing: "-1.5px",
        }}>
          Study Smarter.<br />
          <span style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Pass CA Faster.</span>
        </h1>

        <p style={{ fontSize: 18, color: C.textMid, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Transform your CA notes into mind maps, standards summaries, MCQs,
          amendment trackers and 7-day revision plans — in under 10 seconds.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 52 }}>
          {["📊 FR & IndAS", "⚖️ Corporate Law", "🏛️ Direct Tax", "📋 GST & IDT", "🔍 Auditing", "📈 SFM"].map((f) => (
            <span key={f} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "5px 13px", fontSize: 12, color: C.textMid, fontWeight: 600,
            }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Email gate */}
      <Card style={{ maxWidth: 460, margin: "0 auto" }} glow>
        <h2 style={{ fontFamily: "var(--font-head)", margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: C.white }}>
          Start for Free
        </h2>
        <p style={{ color: C.textMid, margin: "0 0 24px", fontSize: 14 }}>
          5 free generations · 5 free PDF uploads · No credit card needed
        </p>

        <label style={{ display: "block", color: C.textMid, fontSize: 11, fontWeight: 800, marginBottom: 7, letterSpacing: "0.7px" }}>
          YOUR EMAIL
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@example.com"
          onKeyDown={(e) => e.key === "Enter" && go()}
        />

        {err && <p style={{ color: C.red, fontSize: 13, marginTop: 10 }}>{err}</p>}

        <Btn
          style={{ width: "100%", marginTop: 16, justifyContent: "center", padding: "13px 24px", fontSize: 15 }}
          onClick={go}
        >
          Get Started →
        </Btn>

        <GoldDivider />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["5", "Free Generations"], ["5", "Free PDF Uploads"], ["8", "CA Subjects"], ["10+", "Study Tools"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, color: C.gold }}>{n}</div>
              <div style={{ color: C.textMid, fontSize: 11, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Feature grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 64 }}>
        {[
          { icon: "📜", title: "Standards Mapped",    desc: "Auto-identifies IndAS, SA, Sections from your notes",        color: C.blue },
          { icon: "🔔", title: "Amendment Alerts",    desc: "Highlights recent ICAI changes relevant to your topic",       color: C.gold },
          { icon: "🧠", title: "CA-Style MCQs",       desc: "Questions modelled on actual ICAI exam patterns",            color: C.teal },
          { icon: "🧩", title: "Mnemonics",           desc: "Memory devices for complex rules and sequences",              color: "#A78BFA" },
          { icon: "⚠️", title: "Common Mistakes",    desc: "Traps students fall into — know them before the exam",        color: C.red },
          { icon: "📄", title: "PDF Report Export",   desc: "Download your full study package as a formatted PDF",        color: C.green },
        ].map((f) => (
          <Card key={f.title} style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
            <h4 style={{ margin: "0 0 6px", color: f.color, fontSize: 14, fontWeight: 800 }}>{f.title}</h4>
            <p style={{ margin: 0, color: C.textMid, fontSize: 12, lineHeight: 1.6 }}>{f.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

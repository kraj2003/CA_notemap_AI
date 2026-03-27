import { useState } from "react";
import { C, SUBJECTS } from "../utils/constants";

export default function SubjectPage({ onSelect, onBack }) {
  const [attempt, setAttempt] = useState("Final");

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: C.textMid,
        cursor: "pointer", fontSize: 13, marginBottom: 32,
        display: "flex", alignItems: "center", gap: 6,
      }}>← Back</button>

      <div style={{ marginBottom: 36 }}>
        <p style={{ color: C.textMid, fontSize: 13, marginBottom: 6, fontWeight: 700, letterSpacing: "0.5px" }}>
          STEP 1 OF 2
        </p>
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 700, color: C.white, marginBottom: 8 }}>
          Select your CA subject
        </h2>
        <p style={{ color: C.textMid, fontSize: 14 }}>
          The AI adapts its output — standards references, MCQ patterns, and study style — to your subject
        </p>
      </div>

      {/* Attempt selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: C.textMid, fontSize: 13, fontWeight: 700 }}>Attempt:</span>
        {["Foundation", "Intermediate", "Final"].map((a) => (
          <button key={a} onClick={() => setAttempt(a)} style={{
            background: attempt === a ? `${C.gold}18` : "transparent",
            border: `1px solid ${attempt === a ? C.gold : C.border}`,
            borderRadius: 8, padding: "6px 18px",
            color: attempt === a ? C.gold : C.textMid,
            cursor: "pointer", fontSize: 13, fontWeight: 700,
            fontFamily: "var(--font-body)", transition: "all 0.2s",
          }}>{a}</button>
        ))}
      </div>

      {/* Subject grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
        {Object.entries(SUBJECTS).map(([name, cfg]) => (
          <div key={name}
            onClick={() => onSelect(name, attempt)}
            style={{
              background: C.surface,
              border: `2px solid ${C.border}`,
              borderRadius: 14, padding: "20px 18px",
              cursor: "pointer", transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = cfg.color;
              e.currentTarget.style.background  = `${cfg.color}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background  = C.surface;
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{cfg.icon}</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: C.white, fontFamily: "var(--font-head)" }}>
              {name}
            </h3>
            <p style={{ margin: 0, color: C.textMid, fontSize: 11, lineHeight: 1.5 }}>{cfg.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

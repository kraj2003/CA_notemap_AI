import { C } from "../utils/constants";
import { ProgressBar } from "../components/UI";

const CHECKPOINTS = ["Mind Map","Standards","MCQs","Flashcards","Amendments","Study Plan","Mnemonics"];

export default function LoadingPage({ progress, message }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 32,
    }}>
      <div style={{ textAlign: "center", maxWidth: 420, width: "100%" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `${C.gold}18`, border: `2px solid ${C.gold}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", animation: "glow 2s ease-in-out infinite",
          fontSize: 32,
        }}>📊</div>

        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>
          Analysing your CA notes
        </h2>
        <p style={{ color: C.textMid, fontSize: 14, marginBottom: 32, minHeight: 22 }}>
          {message || "Processing..."}
        </p>

        <ProgressBar value={progress} height={4} />
        <p style={{ color: C.textDim, fontSize: 12, marginTop: 10, fontFamily: "var(--font-mono)" }}>
          {Math.round(progress)}%
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 32 }}>
          {CHECKPOINTS.map((t, i) => {
            const done = progress > (i + 1) * 12;
            return (
              <div key={t} style={{
                background: done ? `${C.teal}15` : C.surface,
                border: `1px solid ${done ? C.teal : C.border}`,
                borderRadius: 8, padding: "4px 11px", fontSize: 11,
                fontWeight: 700, color: done ? C.teal : C.textDim,
                transition: "all 0.5s",
              }}>
                {done ? "✓ " : ""}{t}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

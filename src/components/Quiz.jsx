import { useState } from "react";
import { C } from "../utils/constants";
import { Tag, Btn, ProgressBar } from "./UI";

export default function Quiz({ questions, color }) {
  const [cur,   setCur]   = useState(0);
  const [sel,   setSel]   = useState(null);
  const [score, setScore] = useState(0);
  const [done,  setDone]  = useState(false);
  const [log,   setLog]   = useState([]);

  const q = questions[cur];
  const letters = ["A", "B", "C", "D"];

  const pick = (opt) => {
    if (sel !== null) return;
    setSel(opt);
    const ok = opt === q.correct;
    if (ok) setScore((s) => s + 1);
    setLog((l) => [...l, { ...q, chosen: opt, ok }]);
  };

  const next = () => {
    if (cur < questions.length - 1) { setCur((c) => c + 1); setSel(null); }
    else setDone(true);
  };

  const reset = () => { setCur(0); setSel(null); setScore(0); setDone(false); setLog([]); };

  if (done) {
    const pct   = Math.round((score / questions.length) * 100);
    const grade = pct >= 75 ? "Pass" : pct >= 50 ? "Borderline" : "Fail";
    const gCol  = pct >= 75 ? C.green : pct >= 50 ? C.gold : C.red;
    return (
      <div>
        <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: gCol, fontFamily: "var(--font-head)" }}>
            {pct}%
          </div>
          <Tag color={gCol}>{grade} — {score}/{questions.length} correct</Tag>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
          {log.map((a, i) => (
            <div key={i} style={{
              background: a.ok ? `${C.green}0D` : `${C.red}0D`,
              border: `1px solid ${a.ok ? C.green : C.red}30`,
              borderRadius: 10, padding: "12px 16px",
            }}>
              <p style={{ color: C.text, fontSize: 13, marginBottom: 6, lineHeight: 1.5 }}>{a.question}</p>
              <p style={{ color: a.ok ? C.green : C.red, fontSize: 12 }}>
                {a.ok ? "✓" : "✗"} Your answer: {a.chosen}
                {!a.ok && <span style={{ color: C.textMid }}> · Correct: {a.correct}</span>}
              </p>
              {a.section && (
                <p style={{ color: color, fontSize: 11, marginTop: 4, fontFamily: "var(--font-mono)" }}>
                  § {a.section}
                </p>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <Btn onClick={reset}>Retry Quiz</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Tag color={color}>Q {cur + 1} / {questions.length}</Tag>
        <span style={{ color: C.textMid, fontSize: 12 }}>Score: {score}</span>
      </div>
      <ProgressBar value={(cur / questions.length) * 100} color={color} />

      {q.section && (
        <div style={{ color: color, fontSize: 11, fontWeight: 700, margin: "12px 0 4px", fontFamily: "var(--font-mono)" }}>
          § {q.section}
        </div>
      )}

      <p style={{ color: C.white, fontSize: 15, fontWeight: 600, margin: "14px 0 18px", lineHeight: 1.65 }}>
        {q.question}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {(q.options || []).map((opt, i) => {
          let bg = C.surfaceHi, border = C.border, col = C.text;
          if (sel !== null) {
            if (opt === q.correct)              { bg = `${C.green}18`; border = C.green; col = C.green; }
            else if (opt === sel && opt !== q.correct) { bg = `${C.red}18`;   border = C.red;   col = C.red;   }
          }
          return (
            <button key={i} onClick={() => pick(opt)} style={{
              background: bg, border: `1px solid ${border}`, borderRadius: 10,
              padding: "11px 16px", cursor: sel ? "default" : "pointer",
              textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start",
              transition: "all 0.2s", fontFamily: "var(--font-body)",
            }}>
              <span style={{ color: C.textDim, fontSize: 11, fontWeight: 800, minWidth: 18, marginTop: 1, fontFamily: "var(--font-mono)" }}>
                {letters[i]}
              </span>
              <span style={{ color: col, fontSize: 14 }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {sel !== null && (
        <div style={{ marginTop: 14 }}>
          {q.explanation && (
            <div style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px", marginBottom: 12 }}>
              <p style={{ color: C.textMid, fontSize: 13, lineHeight: 1.6 }}>💡 {q.explanation}</p>
            </div>
          )}
          <Btn onClick={next}>
            {cur < questions.length - 1 ? "Next Question →" : "View Results"}
          </Btn>
        </div>
      )}
    </div>
  );
}

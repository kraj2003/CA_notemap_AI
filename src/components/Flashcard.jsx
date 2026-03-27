import { useState, useEffect } from "react";
import { C } from "../utils/constants";
import { Tag } from "./UI";

export default function Flashcard({ card, index, total, color }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => setFlipped(false), [index]);

  if (!card?.question) return null;

  const diffColor =
    card.difficulty === "Easy" ? C.green :
    card.difficulty === "Hard" ? C.red : C.gold;

  return (
    <div
      onClick={() => setFlipped((f) => !f)}
      style={{ cursor: "pointer", perspective: 1000, height: 210 }}
    >
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
        transform: flipped ? "rotateY(180deg)" : "none",
      }}>
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceHi})`,
          border: `1px solid ${C.border}`, borderRadius: 16,
          padding: "20px 24px", display: "flex",
          flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Tag color={color}>Card {index + 1}/{total}</Tag>
              <Tag color={diffColor}>{card.difficulty || "Medium"}</Tag>
            </div>
            <span style={{ color: C.textDim, fontSize: 11, fontFamily: "var(--font-mono)" }}>
              tap to reveal →
            </span>
          </div>
          <p style={{ color: C.white, fontSize: 15, fontWeight: 600, lineHeight: 1.65 }}>
            {card.question}
          </p>
          <div style={{ height: 2, background: `linear-gradient(90deg, ${color}60, transparent)`, borderRadius: 1 }} />
        </div>

        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: `linear-gradient(135deg, ${color}14, ${color}06)`,
          border: `1px solid ${color}40`, borderRadius: 16,
          padding: "20px 24px", display: "flex",
          flexDirection: "column", justifyContent: "space-between",
        }}>
          <Tag color={color}>Answer</Tag>
          <p style={{ color: C.text, fontSize: 14, lineHeight: 1.75 }}>
            {card.answer}
          </p>
          {card.section && (
            <div style={{ color: color, fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              § {card.section}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

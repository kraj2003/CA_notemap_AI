import { useState } from "react";
import { C } from "../utils/constants";

/* ─── Spinner ────────────────────────────────────────────────────────────── */
export const Spinner = ({ size = 18, color = C.gold }) => (
  <span style={{
    display: "inline-block", width: size, height: size,
    border: `2px solid ${color}33`, borderTop: `2px solid ${color}`,
    borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

/* ─── Tag / Badge ────────────────────────────────────────────────────────── */
export const Tag = ({ children, color = C.gold, style = {} }) => (
  <span style={{
    background: `${color}18`, color, border: `1px solid ${color}35`,
    borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.4px", whiteSpace: "nowrap", ...style,
  }}>{children}</span>
);

/* ─── Gold Divider ───────────────────────────────────────────────────────── */
export const GoldDivider = ({ style = {} }) => (
  <div style={{
    height: 1,
    background: `linear-gradient(90deg, transparent, ${C.gold}40, transparent)`,
    margin: "20px 0", ...style,
  }} />
);

/* ─── Card ───────────────────────────────────────────────────────────────── */
export const Card = ({ children, style = {}, glow = false, onClick }) => (
  <div onClick={onClick} style={{
    background: C.surface,
    border: `1px solid ${glow ? C.goldDim : C.border}`,
    borderRadius: 16, padding: 24,
    boxShadow: glow
      ? `0 0 30px ${C.goldGlow}, 0 4px 20px rgba(0,0,0,0.5)`
      : "0 2px 16px rgba(0,0,0,0.4)",
    transition: "all 0.2s", ...style,
  }}>{children}</div>
);

/* ─── Button ─────────────────────────────────────────────────────────────── */
export const Btn = ({
  children, onClick, disabled, variant = "primary",
  style = {}, loading = false, small = false,
}) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
      color: C.bg, border: "none",
      boxShadow: `0 4px 18px rgba(201,168,76,0.3)`,
    },
    ghost:   { background: "transparent", color: C.textMid, border: `1px solid ${C.border}` },
    outline: { background: "transparent", color: C.gold,    border: `1px solid ${C.gold}` },
    danger:  { background: `${C.red}20`,  color: C.red,     border: `1px solid ${C.red}40` },
    teal:    { background: `${C.teal}20`, color: C.teal,    border: `1px solid ${C.teal}40` },
  };
  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...variants[variant],
        borderRadius: 10,
        padding: small ? "7px 16px" : "11px 22px",
        fontSize: small ? 12 : 14,
        fontWeight: 700,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.2s",
        fontFamily: "var(--font-body)",
        display: "inline-flex", alignItems: "center", gap: 8,
        ...style,
      }}
    >
      {loading && <Spinner size={14} color={variant === "primary" ? C.bg : C.gold} />}
      {children}
    </button>
  );
};

/* ─── Progress Bar ───────────────────────────────────────────────────────── */
export const ProgressBar = ({ value, color = C.gold, height = 3 }) => (
  <div style={{ background: C.border, borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{
      width: `${value}%`, height: "100%",
      background: `linear-gradient(90deg, ${color}, ${color}aa)`,
      borderRadius: 99, transition: "width 0.5s ease",
      boxShadow: `0 0 6px ${color}66`,
    }} />
  </div>
);

/* ─── Section Header ─────────────────────────────────────────────────────── */
export const SectionHeader = ({ title, subtitle, color }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{
      fontFamily: "var(--font-head)", margin: "0 0 5px",
      fontSize: 22, fontWeight: 700, color: C.white,
    }}>{title}</h2>
    {subtitle && <p style={{ color: C.textMid, fontSize: 13, margin: 0 }}>{subtitle}</p>}
    <div style={{
      height: 2, width: 60,
      background: `linear-gradient(90deg, ${color}, transparent)`,
      borderRadius: 1, marginTop: 10,
    }} />
  </div>
);

/* ─── Locked overlay ─────────────────────────────────────────────────────── */
export const Locked = ({ onUpgrade }) => (
  <div style={{ textAlign: "center", padding: "48px 24px" }}>
    <div style={{ fontSize: 40, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>🔐</div>
    <h3 style={{
      color: C.white, fontSize: 18, fontWeight: 700, marginBottom: 8,
      fontFamily: "var(--font-head)",
    }}>Premium Feature</h3>
    <p style={{ color: C.textMid, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
      Upgrade to unlock MCQ Quiz, Flashcards, Study Plan, Amendment Tracker and PDF Export.
    </p>
    <Btn onClick={onUpgrade}>Unlock Premium — ₹99/month</Btn>
  </div>
);

/* ─── Payment Modal ──────────────────────────────────────────────────────── */
export const PayModal = ({ onClose, onUnlock }) => {
  const [code, setCode] = useState("");
  const [err,  setErr]  = useState("");

  const handle = () => {
    if (onUnlock(code)) setErr("");
    else setErr("Invalid code. Please check and try again.");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 24,
    }}>
      <Card glow style={{ maxWidth: 420, width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 16,
          background: "none", border: "none", color: C.textMid,
          cursor: "pointer", fontSize: 22,
        }}>×</button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>✦</div>
          <h3 style={{
            fontFamily: "var(--font-head)", margin: "0 0 6px",
            fontSize: 22, fontWeight: 700, color: C.white,
          }}>Upgrade to Premium</h3>
          <p style={{ color: C.textMid, fontSize: 13 }}>
            Everything unlocked for your CA preparation
          </p>
        </div>

        <div style={{
          background: `${C.gold}0C`, border: `1px solid ${C.gold}25`,
          borderRadius: 14, padding: "18px 20px", marginBottom: 22,
        }}>
          <div style={{
            fontFamily: "var(--font-head)", fontSize: 30,
            fontWeight: 700, color: C.gold, marginBottom: 4,
          }}>
            ₹99
            <span style={{ fontSize: 14, color: C.textMid, fontWeight: 400, fontFamily: "var(--font-body)" }}>
              /month
            </span>
          </div>
          {[
            "Unlimited generations",
            "Unlimited PDF uploads",
            "MCQ Quiz + Flashcards",
            "7-Day study plans",
            "Amendment tracker",
            "Mnemonics + Mistake alerts",
            "Full PDF report download",
            "Priority support",
          ].map((f) => (
            <div key={f} style={{ color: C.textMid, fontSize: 13, marginTop: 7, display: "flex", gap: 8 }}>
              <span style={{ color: C.gold }}>✓</span>{f}
            </div>
          ))}
        </div>

        <Btn
          style={{ width: "100%", justifyContent: "center", marginBottom: 18 }}
          onClick={() => window.open("https://razorpay.com", "_blank")}
        >
          Pay ₹99 via Razorpay
        </Btn>

        <GoldDivider />
        <p style={{ color: C.textMid, fontSize: 13, marginBottom: 10 }}>
          Already paid? Enter your access code:
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. PAID99"
          />
          <Btn variant="outline" onClick={handle}>Unlock</Btn>
        </div>
        {err && <p style={{ color: C.red, fontSize: 12, marginTop: 8 }}>{err}</p>}
        <p style={{ color: C.textDim, fontSize: 11, marginTop: 12, textAlign: "center" }}>
          5 free generations + 5 PDF uploads included. No auto-renewal.
        </p>
      </Card>
    </div>
  );
};

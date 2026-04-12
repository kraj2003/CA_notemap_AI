/**
 * UI.jsx — Phase 3 Update
 * ====================================
 * CHANGES FROM ORIGINAL:
 *   - PayModal: removed manual code input entirely
 *   - PayModal: Razorpay-only flow with email prefill
 *   - PayModal: stores pending email in localStorage before redirect
 *   - PayModal: clear messaging about what happens after payment
 *   - All other components (Spinner, Tag, Card, Btn, etc.) unchanged
 *
 * HOW PAYMENT FLOW WORKS:
 *   1. User clicks "Pay ₹99 via Razorpay"
 *   2. Their email is saved to localStorage as "ca_pending_email"
 *   3. Razorpay opens in new tab with email prefilled
 *   4. After payment, Razorpay redirects to your app with ?payment_id=xxx
 *   5. App.jsx useEffect catches this, verifies, activates premium
 */

import { useState } from "react";
import { C } from "../utils/constants";
import { track, EVENTS } from "../utils/analytics";

// ── Spinner ────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 18, color = C.gold }) => (
  <span style={{
    display: "inline-block", width: size, height: size,
    border: `2px solid ${color}33`, borderTop: `2px solid ${color}`,
    borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

// ── Tag ────────────────────────────────────────────────────────────────────
export const Tag = ({ children, color = C.gold, style = {} }) => (
  <span style={{
    background: `${color}18`, color, border: `1px solid ${color}35`,
    borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.4px", whiteSpace: "nowrap", ...style,
  }}>{children}</span>
);

// ── Gold Divider ───────────────────────────────────────────────────────────
export const GoldDivider = ({ style = {} }) => (
  <div style={{
    height: 1,
    background: `linear-gradient(90deg, transparent, ${C.gold}40, transparent)`,
    margin: "20px 0", ...style,
  }} />
);

// ── Card ───────────────────────────────────────────────────────────────────
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

// ── Button ─────────────────────────────────────────────────────────────────
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

// ── Progress Bar ───────────────────────────────────────────────────────────
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

// ── Section Header ─────────────────────────────────────────────────────────
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

// ── Locked Overlay ─────────────────────────────────────────────────────────
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

// ── Payment Modal (Razorpay Only) ──────────────────────────────────────────
//
// SETUP: Replace YOUR_RAZORPAY_LINK_ID below with your actual Payment Link ID
// from the Razorpay dashboard (looks like: rzp.io/l/AbCdEfGh)
//
// HOW IT WORKS:
//   1. User clicks Pay → we save their email to localStorage
//   2. Razorpay opens in new tab with email prefilled
//   3. After payment, Razorpay redirects to your site
//   4. App.jsx catches the ?payment_id param and verifies
//
export const PayModal = ({ onClose, email }) => {
  const [clicked, setClicked] = useState(false);

  // ↓ Replace this with your actual Razorpay Payment Link
  const RAZORPAY_LINK = `https://rzp.io/rzp/y11bd7k`;

  const handlePay = () => {
    // Save pending email so we know who to activate on return
    track(EVENTS.PAYMENT_INITIATED);
    localStorage.setItem("ca_pending_email", email);
    setClicked(true);
    window.open(RAZORPAY_LINK, "_blank");
  };

  const features = [
    "Unlimited note generations",
    "Unlimited PDF uploads",
    "MCQ Quiz — ICAI exam pattern",
    "Flip Flashcards — all difficulties",
    "7-Day personalised study plan",
    "Recent amendment tracker",
    "Mnemonics + common mistake alerts",
    "Full PDF report download",
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 24,
    }}>
      <Card glow style={{ maxWidth: 440, width: "100%", position: "relative" }}>

        {/* Close button */}
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 16,
          background: "none", border: "none", color: C.textMid,
          cursor: "pointer", fontSize: 22, lineHeight: 1,
        }}>×</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 38, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>✦</div>
          <h3 style={{
            fontFamily: "var(--font-head)", margin: "0 0 8px",
            fontSize: 22, fontWeight: 700, color: C.white,
          }}>
            {clicked ? "Payment window opened ↗" : "You've used your 5 free generations"}
          </h3>
          <p style={{ color: C.textMid, fontSize: 13, lineHeight: 1.6 }}>
            {clicked
              ? `Complete payment in the Razorpay tab. Once done, return here and refresh — your premium will activate automatically for ${email}`
              : "Upgrade to continue. Unlock all 9 tools, unlimited generations, and PDF export."
            }
          </p>
        </div>

        {/* Pricing */}
        <div style={{
          background: `${C.gold}0C`, border: `1px solid ${C.gold}25`,
          borderRadius: 14, padding: "18px 20px", marginBottom: 22,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
            <span style={{
              fontFamily: "var(--font-head)", fontSize: 32,
              fontWeight: 700, color: C.gold,
            }}>₹99</span>
            <span style={{ fontSize: 13, color: C.textMid }}>/ month</span>
          </div>
          {features.map((f) => (
            <div key={f} style={{
              color: C.textMid, fontSize: 13, marginTop: 7,
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <span style={{ color: C.gold, fontSize: 12 }}>✓</span>
              {f}
            </div>
          ))}
        </div>

        {/* Pay button */}
        <Btn
          style={{ width: "100%", justifyContent: "center", padding: "14px 24px", fontSize: 15, marginBottom: 14 }}
          onClick={handlePay}
        >
          {clicked ? "Reopen Payment Page ↗" : "Pay ₹99 via Razorpay →"}
        </Btn>

        {/* Email confirmation */}
        <div style={{
          background: C.surfaceHi, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "10px 14px",
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <span style={{ fontSize: 14 }}>📧</span>
          <div>
            <div style={{ color: C.textDim, fontSize: 10, fontWeight: 800, letterSpacing: "0.5px" }}>PREMIUM ACTIVATES FOR</div>
            <div style={{ color: C.gold, fontSize: 13, fontWeight: 700, marginTop: 2 }}>{email}</div>
          </div>
        </div>

        <p style={{ color: C.textDim, fontSize: 11, marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
          Secure payment via Razorpay · No auto-renewal · 5 free generations always included
        </p>
      </Card>
    </div>
  );
};
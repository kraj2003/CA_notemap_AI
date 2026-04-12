/**
 * InputPage.jsx — Phase 4 Update
 * ====================================
 * CHANGES FROM ORIGINAL:
 *   - Smart upgrade nudge appears at generation 3 (not 5)
 *   - Cleaner usage display
 *   - Checking spinner while premium status loads
 *
 * WHY NUDGE AT 3 NOT 5:
 *   At generation 5, the user is blocked and frustrated.
 *   At generation 3, they've had success (3 wins!), they see value,
 *   and they have 2 left — enough to still feel generous about.
 *   That's the moment to convert, not when they're hitting a wall.
 */

import { useState, useRef } from "react";
import { C, SUBJECTS, SAMPLE_TOPICS, FREE_GENERATIONS, FREE_PDF_UPLOADS } from "../utils/constants";
import { Card, Btn, Tag, Spinner } from "../components/UI";

export default function InputPage({
  subject, attempt, user, noteText, setNoteText,
  onGenerate, onChangeSubject, onShowPayment, error,
}) {
  const {
    email, isPremium, isOwner, freeGens, freePdfs,
    canGenerate, canUploadPdf, checking,
  } = user;

  const [pdfName,    setPdfName]    = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfErr,     setPdfErr]     = useState("");
  const fileRef = useRef(null);

  const subjectColor = SUBJECTS[subject]?.color || C.gold;
  const ownerMode    = isOwner();

  // ── PDF extraction ────────────────────────────────────────────────────────
  const handlePdf = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPdfErr("Only PDF files are supported."); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfErr("File too large. Max 10 MB."); return;
    }
    if (!canUploadPdf()) {
      onShowPayment(); return;
    }

    setPdfLoading(true);
    setPdfErr("");
    setPdfName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      if (!window.pdfjsLib) {
        const text = new TextDecoder("utf-8", { fatal: false }).decode(uint8);
        const cleaned = text
          .replace(/[^\x20-\x7E\n\r\t\u00A0-\uFFFF]/g, " ")
          .replace(/\s{3,}/g, "\n")
          .trim();
        if (cleaned.length > 80) {
          setNoteText(cleaned.slice(0, 4000));
          user.incrementPdf();
        } else {
          setPdfErr("Could not extract text. Please use a text-based PDF or paste notes manually.");
        }
        setPdfLoading(false);
        return;
      }

      const pdf   = await window.pdfjsLib.getDocument({ data: uint8 }).promise;
      const pages = Math.min(pdf.numPages, 20);
      const parts = [];
      for (let i = 1; i <= pages; i++) {
        const page    = await pdf.getPage(i);
        const content = await page.getTextContent();
        parts.push(content.items.map((item) => item.str).join(" "));
      }
      const extracted = parts.join("\n").trim();
      if (extracted.length < 50) {
        setPdfErr("Could not extract text. Please use a text-based PDF.");
      } else {
        setNoteText(extracted.slice(0, 4000));
        user.incrementPdf();
      }
    } catch (e) {
      setPdfErr("Failed to read PDF: " + e.message);
    }
    setPdfLoading(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <button onClick={onChangeSubject} style={{ background: "none", border: "none", color: C.textMid, cursor: "pointer", fontSize: 13 }}>
          ← Change Subject
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{
            background: `${subjectColor}18`, border: `1px solid ${subjectColor}40`,
            borderRadius: 8, padding: "5px 14px", color: subjectColor, fontWeight: 800, fontSize: 13,
          }}>
            {SUBJECTS[subject]?.icon} {subject}
          </div>
          <Tag color={C.textMid}>{attempt}</Tag>

          {/* Premium status indicator */}
          {checking
            ? <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textDim, fontSize: 12 }}>
                <Spinner size={12} color={C.textDim} /> Checking...
              </span>
            : ownerMode
              ? <Tag color={C.green}>OWNER · Unlimited</Tag>
              : isPremium
                ? <Tag color={C.green}>PREMIUM ✓</Tag>
                : <button
                    onClick={onShowPayment}
                    style={{
                      background: `${C.gold}15`, border: `1px solid ${C.gold}40`,
                      borderRadius: 8, padding: "5px 12px", color: C.gold,
                      cursor: "pointer", fontSize: 12, fontWeight: 800,
                      fontFamily: "var(--font-body)",
                    }}>
                    Upgrade ✦
                  </button>
          }
        </div>
      </div>

      {/* ── Smart Upgrade Nudge — shows at generation 3, not 5 ── */}
      {/* This is intentional. At gen 3 users have seen value and still have 2 left.
          That's a much better conversion moment than blocking them at gen 5. */}
      {!ownerMode && !isPremium && !checking && freeGens >= 3 && canGenerate() && (
        <div style={{
          background: `${C.gold}10`, border: `1px solid ${C.gold}30`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 10,
        }}>
          <span style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>
            ⚡ {FREE_GENERATIONS - freeGens} free generation{FREE_GENERATIONS - freeGens === 1 ? "" : "s"} remaining
          </span>
          <Btn small variant="outline" onClick={onShowPayment}>
            Upgrade — ₹99/mo
          </Btn>
        </div>
      )}

      {/* Usage bar — only for free users */}
      {!ownerMode && !isPremium && !checking && (
        <div style={{
          background: C.surfaceHi, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "10px 16px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ color: C.textMid, fontSize: 13 }}>
            Generations: <strong style={{ color: freeGens >= FREE_GENERATIONS ? C.red : C.gold }}>
              {freeGens}/{FREE_GENERATIONS}
            </strong>
            &nbsp;·&nbsp;
            PDFs: <strong style={{ color: freePdfs >= FREE_PDF_UPLOADS ? C.red : C.teal }}>
              {freePdfs}/{FREE_PDF_UPLOADS}
            </strong>
          </span>
          {!canGenerate() && (
            <Btn small variant="outline" onClick={onShowPayment}>Upgrade Now</Btn>
          )}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 700, color: C.white, marginBottom: 6 }}>
          Paste your notes or upload a PDF
        </h2>
        <p style={{ color: C.textMid, fontSize: 14 }}>
          Chapter notes, textbook content, case studies — AI does the rest
        </p>
      </div>

      {/* PDF Upload */}
      <Card style={{ marginBottom: 16, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ color: C.white, fontSize: 15, fontWeight: 700, margin: "0 0 3px" }}>📄 Upload PDF</h3>
            <p style={{ color: C.textMid, fontSize: 12, margin: 0 }}>
              {ownerMode || isPremium ? "Unlimited uploads" : `${Math.max(0, FREE_PDF_UPLOADS - freePdfs)} free uploads remaining`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {pdfName && (
              <span style={{ color: C.teal, fontSize: 12, fontFamily: "var(--font-mono)" }}>
                ✓ {pdfName.length > 24 ? pdfName.slice(0, 24) + "…" : pdfName}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => handlePdf(e.target.files?.[0])}
            />
            <Btn
              small variant="teal" loading={pdfLoading}
              onClick={() => {
                if (!canUploadPdf()) { onShowPayment(); return; }
                fileRef.current?.click();
              }}
            >
              {pdfLoading ? "Extracting…" : "Choose PDF"}
            </Btn>
          </div>
        </div>

        {/* Drag & Drop */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = C.teal; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = C.border;
            const file = e.dataTransfer.files?.[0];
            if (file) handlePdf(file);
          }}
          onClick={() => { if (canUploadPdf()) fileRef.current?.click(); else onShowPayment(); }}
          style={{
            border: `2px dashed ${C.border}`, borderRadius: 10,
            padding: "20px", textAlign: "center", cursor: "pointer",
            transition: "border-color 0.2s", background: C.surfaceHi,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>📥</div>
          <p style={{ color: C.textMid, fontSize: 13, margin: 0 }}>
            Drag & drop a PDF here, or <span style={{ color: C.teal, fontWeight: 700 }}>click to browse</span>
          </p>
          <p style={{ color: C.textDim, fontSize: 11, marginTop: 4 }}>PDF only · Max 10 MB · Up to 20 pages</p>
        </div>

        {pdfErr && <p style={{ color: C.red, fontSize: 13, marginTop: 10 }}>{pdfErr}</p>}
      </Card>

      {/* Text area */}
      <Card style={{ marginBottom: 16 }}>
        <label style={{ display: "block", color: C.textMid, fontSize: 11, fontWeight: 800, marginBottom: 8, letterSpacing: "0.5px" }}>
          OR PASTE YOUR NOTES DIRECTLY
        </label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={`Paste your ${subject} notes here...\n\nExample: As per Section 43B of Income Tax Act, certain deductions are allowed only on actual payment basis...`}
          style={{ minHeight: 200 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ color: C.textDim, fontSize: 12, fontFamily: "var(--font-mono)" }}>
            {noteText.trim().split(/\s+/).filter(Boolean).length} words
          </span>
          <span style={{ color: C.textDim, fontSize: 12 }}>
            {ownerMode || isPremium ? "Up to 4,000 words" : "1,500 word limit on free tier"}
          </span>
        </div>
      </Card>

      {/* Error display */}
      {error && (
        <div style={{
          background: `${C.red}12`, border: `1px solid ${C.red}35`,
          borderRadius: 10, padding: "11px 16px",
          color: C.red, fontSize: 13, marginBottom: 16, lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      {/* Generate button */}
      <Btn
        onClick={onGenerate}
        disabled={noteText.trim().length < 40 || (!canGenerate() && !checking)}
        loading={checking}
        style={{ width: "100%", justifyContent: "center", padding: "14px 24px", fontSize: 15 }}
      >
        {checking ? "Checking account..." : "🧠 Generate CA Study Package"}
      </Btn>

      {!ownerMode && !isPremium && !checking && canGenerate() && (
        <p style={{ color: C.textDim, fontSize: 12, textAlign: "center", marginTop: 12 }}>
          Free: Mind Map + Concept Flow + Summary ·{" "}
          <button
            onClick={onShowPayment}
            style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit" }}
          >
            Upgrade for all 9 tools →
          </button>
        </p>
      )}

      {/* Quick-start topics */}
      <div style={{ marginTop: 28 }}>
        <p style={{ color: C.textDim, fontSize: 12, fontWeight: 700, marginBottom: 10, letterSpacing: "0.4px" }}>
          QUICK START — SAMPLE TOPICS:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(SAMPLE_TOPICS[subject] || []).map((t) => (
            <button
              key={t}
              onClick={() => setNoteText(`Topic: ${t}\n\nGenerate comprehensive CA ${attempt} study notes for this topic.`)}
              style={{
                background: C.surfaceHi, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "5px 12px",
                color: C.textMid, cursor: "pointer", fontSize: 12, fontWeight: 600,
                fontFamily: "var(--font-body)", transition: "all 0.2s",
              }}
            >{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
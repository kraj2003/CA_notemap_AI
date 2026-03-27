/**
 * PDF Export Utility
 * Uses jsPDF (loaded via CDN in index.html)
 * Generates a full structured CA study report
 */

export async function generatePDF(results, subject, attempt, email) {
  // jsPDF loaded globally via CDN
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210; // A4 width mm
  const MARGIN = 18;
  const CONTENT_W = W - MARGIN * 2;
  let y = 0;

  // ── Colors (RGB) ──────────────────────────────────────────
  const GOLD   = [201, 168, 76];
  const DARK   = [8, 12, 16];
  const NAVY   = [17, 24, 32];
  const TEAL   = [14, 165, 160];
  const RED    = [224, 82, 82];
  const GREEN  = [61, 184, 138];
  const WHITE  = [240, 235, 224];
  const GRAY   = [138, 155, 172];
  const LGRAY  = [30, 45, 61];

  // ── Helpers ────────────────────────────────────────────────
  const setFont = (style = "normal", size = 10) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const setColor = (rgb) => doc.setTextColor(...rgb);
  const setFill  = (rgb) => doc.setFillColor(...rgb);
  const setDraw  = (rgb) => doc.setDrawColor(...rgb);

  const checkPage = (needed = 20) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  const hLine = (color = LGRAY, thickness = 0.3) => {
    setDraw(color);
    doc.setLineWidth(thickness);
    doc.line(MARGIN, y, W - MARGIN, y);
    y += 4;
  };

  const sectionBadge = (text, color = GOLD) => {
    checkPage(14);
    setFill(color);
    doc.roundedRect(MARGIN, y, CONTENT_W, 10, 2, 2, "F");
    setFont("bold", 11);
    setColor(DARK);
    doc.text(text, MARGIN + 4, y + 7);
    y += 14;
  };

  const bullet = (text, indent = 0, color = GRAY) => {
    checkPage(8);
    setFont("normal", 9);
    setColor(color);
    const lines = doc.splitTextToSize(`• ${text}`, CONTENT_W - indent - 4);
    doc.text(lines, MARGIN + indent + 3, y);
    y += lines.length * 5 + 1;
  };

  const bodyText = (text, color = WHITE, size = 10, indent = 0) => {
    checkPage(10);
    setFont("normal", size);
    setColor(color);
    const lines = doc.splitTextToSize(text, CONTENT_W - indent);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * (size * 0.42) + 2;
  };

  const label = (text, color = GRAY, size = 8) => {
    checkPage(8);
    setFont("bold", size);
    setColor(color);
    doc.text(text.toUpperCase(), MARGIN, y);
    y += 5;
  };

  const tag = (text, x, tagY, color = GOLD) => {
    setFill([...color, 40]);
    setFont("bold", 7);
    const tw = doc.getTextWidth(text) + 4;
    doc.roundedRect(x, tagY - 4, tw, 5.5, 1, 1, "F");
    setColor(color);
    doc.text(text, x + 2, tagY);
    return tw + 3;
  };

  // ══════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════════════════════
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");

  // Gold accent bar top
  setFill(GOLD);
  doc.rect(0, 0, W, 3, "F");

  // Logo area
  y = 30;
  setFont("bold", 9);
  setColor(GOLD);
  doc.text("CA NOTEMAP AI", MARGIN, y);
  setFont("normal", 8);
  setColor(GRAY);
  doc.text("Powered by Anthropic Claude", MARGIN, y + 6);

  // Main title
  y = 80;
  setFont("bold", 28);
  setColor(WHITE);
  const titleLines = doc.splitTextToSize(results.title || "CA Study Report", CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 12 + 6;

  setFont("normal", 13);
  setColor(GOLD);
  doc.text(`${subject}  ·  CA ${attempt}`, MARGIN, y);
  y += 18;

  // Horizontal rule
  setDraw(GOLD);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + 60, y);
  y += 14;

  // Meta info
  const meta = [
    ["Generated for", email],
    ["Subject", subject],
    ["Attempt", `CA ${attempt}`],
    ["Date", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
    ["Total Sections", "10 comprehensive study sections"],
  ];
  meta.forEach(([k, v]) => {
    setFont("bold", 9);
    setColor(GOLD);
    doc.text(k + ":", MARGIN, y);
    setFont("normal", 9);
    setColor(WHITE);
    doc.text(v, MARGIN + 38, y);
    y += 7;
  });

  // Content summary boxes
  y = 210;
  const boxes = [
    ["Mind Map", "Visual overview"],
    ["Standards", "ICAI references"],
    ["MCQ Quiz", "Exam practice"],
    ["Flash Cards", "Quick revision"],
    ["Amendments", "Latest changes"],
    ["Study Plan", "7-day schedule"],
  ];
  const bw = (CONTENT_W - 10) / 3;
  boxes.forEach((b, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = MARGIN + col * (bw + 5);
    const by = y + row * 20;
    setFill(NAVY);
    setDraw(LGRAY);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, by, bw, 16, 2, 2, "FD");
    setFont("bold", 9);
    setColor(GOLD);
    doc.text(b[0], bx + 4, by + 7);
    setFont("normal", 7);
    setColor(GRAY);
    doc.text(b[1], bx + 4, by + 12);
  });

  // Footer
  setFont("normal", 8);
  setColor(GRAY);
  doc.text("canotemap.ai  ·  Specialized for ICAI Exam Preparation", MARGIN, 285);
  setFill(GOLD);
  doc.rect(0, 294, W, 3, "F");

  // ══════════════════════════════════════════════════════════
  // PAGE 2 — QUICK RECAP + EXAM FOCUS
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;

  sectionBadge("⚡  30-SECOND QUICK RECAP", GOLD);
  setFill(NAVY);
  doc.roundedRect(MARGIN, y, CONTENT_W, 30, 3, 3, "F");
  setDraw(GOLD);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN, y + 30);
  setFont("normal", 10);
  setColor(WHITE);
  const sumLines = doc.splitTextToSize(results.summary30sec || "", CONTENT_W - 10);
  doc.text(sumLines, MARGIN + 5, y + 7);
  y += Math.max(35, sumLines.length * 5 + 10);

  if (results.examFocus) {
    y += 6;
    sectionBadge("🎯  HOW ICAI EXAMINES THIS TOPIC", TEAL);
    bodyText(results.examFocus, WHITE, 10);
  }

  // Mnemonics
  if ((results.mnemonics || []).length > 0) {
    y += 8;
    sectionBadge("🧩  MEMORY AIDS & MNEMONICS", [130, 100, 200]);
    results.mnemonics.forEach((m) => {
      checkPage(24);
      setFill(NAVY);
      doc.roundedRect(MARGIN, y, CONTENT_W, 22, 2, 2, "F");
      setFont("bold", 9);
      setColor(GRAY);
      doc.text(m.concept || "", MARGIN + 4, y + 6);
      setFont("bold", 13);
      setColor([160, 130, 220]);
      doc.text(m.mnemonic || "", MARGIN + 4, y + 14);
      setFont("normal", 8);
      setColor(WHITE);
      const expLines = doc.splitTextToSize(m.explanation || "", CONTENT_W / 2);
      doc.text(expLines, MARGIN + 80, y + 8);
      y += 26;
    });
  }

  // Common Mistakes
  if ((results.commonMistakes || []).length > 0) {
    y += 6;
    sectionBadge("⚠️  COMMON EXAM MISTAKES", RED);
    results.commonMistakes.forEach((m) => {
      checkPage(22);
      setFill([40, 18, 18]);
      doc.roundedRect(MARGIN, y, CONTENT_W, 18, 2, 2, "F");
      setFont("bold", 9);
      setColor(RED);
      const mLines = doc.splitTextToSize(`✗  ${m.mistake}`, CONTENT_W - 8);
      doc.text(mLines, MARGIN + 4, y + 6);
      setFont("normal", 8);
      setColor(WHITE);
      const cLines = doc.splitTextToSize(`→  ${m.correction}`, CONTENT_W - 8);
      doc.text(cLines, MARGIN + 4, y + 6 + mLines.length * 4.5);
      y += Math.max(22, (mLines.length + cLines.length) * 4.5 + 8);
    });
  }

  // ══════════════════════════════════════════════════════════
  // PAGE 3 — HIGH WEIGHTAGE TOPICS
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;
  sectionBadge("🎯  HIGH WEIGHTAGE EXAM TOPICS", RED);

  (results.highWeightTopics || []).forEach((t, i) => {
    checkPage(28);
    const color = t.importance === "HIGH" ? RED : GOLD;
    setFill(NAVY);
    doc.roundedRect(MARGIN, y, CONTENT_W, 24, 2, 2, "F");
    setDraw(color);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y, MARGIN, y + 24);
    // Number
    setFont("bold", 14);
    setColor(color);
    doc.text(`${i + 1}`, MARGIN + 5, y + 13);
    // Topic name
    setFont("bold", 10);
    setColor(WHITE);
    doc.text(t.topic || "", MARGIN + 14, y + 8);
    // Tags
    let tx = MARGIN + 14;
    if (t.importance) { tag(t.importance, tx, y + 15, color); tx += doc.getTextWidth(t.importance) + 8; }
    if (t.marks) { tag(t.marks, tx, y + 15, TEAL); tx += doc.getTextWidth(t.marks) + 8; }
    // Section ref
    if (t.section) {
      setFont("bold", 7);
      setColor(GOLD);
      doc.text(`§ ${t.section}`, W - MARGIN - doc.getTextWidth(`§ ${t.section}`) - 2, y + 8);
    }
    // Reason
    setFont("normal", 8);
    setColor(GRAY);
    const rLines = doc.splitTextToSize(t.reason || "", CONTENT_W - 20);
    doc.text(rLines, MARGIN + 14, y + 17);
    y += Math.max(28, rLines.length * 4 + 20);
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 4 — STANDARDS & SECTIONS
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;
  sectionBadge("📜  STANDARDS & SECTIONS REFERENCE", [74, 158, 219]);

  (results.standards || []).forEach((s) => {
    checkPage(40);
    setFill(NAVY);
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1, 1, "F");
    setFont("bold", 10);
    setColor(WHITE);
    doc.text(s.name || "", MARGIN + 3, y + 6);
    if (s.number) {
      setFont("bold", 8);
      setColor(GOLD);
      doc.text(`§ ${s.number}`, W - MARGIN - doc.getTextWidth(`§ ${s.number}`) - 2, y + 6);
    }
    y += 11;
    (s.keypoints || []).forEach((kp) => bullet(kp, 2, WHITE));
    if (s.examTip) {
      checkPage(12);
      setFill([10, 40, 38]);
      const tipLines = doc.splitTextToSize(s.examTip, CONTENT_W - 16);
      doc.roundedRect(MARGIN + 2, y, CONTENT_W - 4, tipLines.length * 4.5 + 6, 2, 2, "F");
      setFont("bold", 7);
      setColor(TEAL);
      doc.text("🎯 EXAM TIP:", MARGIN + 5, y + 5);
      setFont("normal", 8);
      setColor(WHITE);
      doc.text(tipLines, MARGIN + 28, y + 5);
      y += tipLines.length * 4.5 + 9;
    }
    if (s.recentChange) {
      checkPage(12);
      setFill([35, 28, 10]);
      const rcLines = doc.splitTextToSize(s.recentChange, CONTENT_W - 16);
      doc.roundedRect(MARGIN + 2, y, CONTENT_W - 4, rcLines.length * 4.5 + 6, 2, 2, "F");
      setFont("bold", 7);
      setColor(GOLD);
      doc.text("🔔 AMENDMENT:", MARGIN + 5, y + 5);
      setFont("normal", 8);
      setColor(WHITE);
      doc.text(rcLines, MARGIN + 32, y + 5);
      y += rcLines.length * 4.5 + 9;
    }
    y += 6;
    hLine();
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 5 — FLASHCARDS
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;
  sectionBadge("🃏  QUICK REVISION FLASHCARDS", [130, 100, 200]);

  (results.flashcards || []).forEach((fc, i) => {
    checkPage(28);
    const diffColor = fc.difficulty === "Easy" ? GREEN : fc.difficulty === "Hard" ? RED : GOLD;
    // Q side
    setFill(NAVY);
    doc.roundedRect(MARGIN, y, CONTENT_W, 12, 2, 2, "F");
    setFont("bold", 7);
    setColor(diffColor);
    doc.text(`Q${i + 1} · ${fc.difficulty || "Medium"}`, MARGIN + 3, y + 5);
    if (fc.section) {
      setFont("bold", 7);
      setColor(GOLD);
      doc.text(`§ ${fc.section}`, W - MARGIN - doc.getTextWidth(`§ ${fc.section}`) - 2, y + 5);
    }
    setFont("normal", 9);
    setColor(WHITE);
    const qLines = doc.splitTextToSize(fc.question || "", CONTENT_W - 6);
    doc.text(qLines, MARGIN + 3, y + 10);
    y += Math.max(16, qLines.length * 4.5 + 8);
    // A side
    setFill([18, 32, 28]);
    const aLines = doc.splitTextToSize(fc.answer || "", CONTENT_W - 10);
    doc.roundedRect(MARGIN + 4, y, CONTENT_W - 4, aLines.length * 4.5 + 7, 2, 2, "F");
    setFont("bold", 7);
    setColor(GREEN);
    doc.text("ANSWER:", MARGIN + 7, y + 5);
    setFont("normal", 8);
    setColor(WHITE);
    doc.text(aLines, MARGIN + 7, y + 10);
    y += aLines.length * 4.5 + 12;
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 6 — MCQ QUIZ
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;
  sectionBadge("❓  ICAI-STYLE MCQ PRACTICE", TEAL);

  (results.quiz || []).forEach((q, i) => {
    checkPage(42);
    setFont("bold", 9);
    setColor(GOLD);
    doc.text(`Q${i + 1}.`, MARGIN, y + 5);
    if (q.section) {
      setFont("bold", 7);
      setColor(GOLD);
      doc.text(`§ ${q.section}`, W - MARGIN - doc.getTextWidth(`§ ${q.section}`) - 2, y + 5);
    }
    setFont("normal", 9);
    setColor(WHITE);
    const qLines = doc.splitTextToSize(q.question || "", CONTENT_W - 10);
    doc.text(qLines, MARGIN + 8, y + 5);
    y += qLines.length * 5 + 5;
    // Options
    const letters = ["A", "B", "C", "D"];
    (q.options || []).forEach((opt, j) => {
      checkPage(8);
      const isCorrect = opt === q.correct;
      if (isCorrect) {
        setFill([10, 35, 25]);
        doc.roundedRect(MARGIN + 4, y - 1, CONTENT_W - 4, 6.5, 1, 1, "F");
      }
      setFont(isCorrect ? "bold" : "normal", 8);
      setColor(isCorrect ? GREEN : GRAY);
      doc.text(`${letters[j]})  ${opt}${isCorrect ? "  ✓" : ""}`, MARGIN + 7, y + 4);
      y += 6.5;
    });
    // Explanation
    if (q.explanation) {
      checkPage(12);
      setFill([8, 20, 30]);
      const expLines = doc.splitTextToSize(q.explanation, CONTENT_W - 14);
      doc.roundedRect(MARGIN + 4, y, CONTENT_W - 4, expLines.length * 4 + 6, 1, 1, "F");
      setFont("bold", 7);
      setColor(TEAL);
      doc.text("💡 EXPLANATION:", MARGIN + 7, y + 4);
      setFont("normal", 7);
      setColor(GRAY);
      doc.text(expLines, MARGIN + 7, y + 9);
      y += expLines.length * 4 + 9;
    }
    y += 6;
    hLine(LGRAY, 0.2);
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 7 — AMENDMENTS
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;
  sectionBadge("🔔  RECENT AMENDMENTS & NOTIFICATIONS", GOLD);

  (results.amendments || []).forEach((a) => {
    checkPage(36);
    const pColor = a.priority === "HIGH" ? RED : GOLD;
    setFill(NAVY);
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1, 1, "F");
    setFont("bold", 9);
    setColor(WHITE);
    doc.text(a.title || "", MARGIN + 3, y + 6);
    y += 11;
    setFont("normal", 9);
    setColor(WHITE);
    const sLines = doc.splitTextToSize(a.summary || "", CONTENT_W - 4);
    doc.text(sLines, MARGIN + 3, y);
    y += sLines.length * 5 + 3;
    // Tags row
    tag(a.priority || "MEDIUM", MARGIN + 3, y + 4, pColor);
    tag(a.effective || "", MARGIN + 30, y + 4, TEAL);
    y += 8;
    if (a.impact) {
      checkPage(10);
      setFill([30, 24, 8]);
      const impLines = doc.splitTextToSize(a.impact, CONTENT_W - 14);
      doc.roundedRect(MARGIN + 2, y, CONTENT_W - 4, impLines.length * 4 + 6, 1, 1, "F");
      setFont("bold", 7);
      setColor(GOLD);
      doc.text("📌 EXAM IMPACT:", MARGIN + 5, y + 5);
      setFont("normal", 7);
      setColor(WHITE);
      doc.text(impLines, MARGIN + 35, y + 5);
      y += impLines.length * 4 + 9;
    }
    y += 4;
    hLine(LGRAY, 0.2);
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 8 — CONCEPT FLOW
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;
  sectionBadge("🌊  CONCEPT FLOW — UNDERSTAND WHY & HOW", [14, 165, 160]);

  (results.conceptFlow || []).forEach((step, i) => {
    checkPage(32);
    // Step circle
    setFill(NAVY);
    doc.circle(MARGIN + 5, y + 6, 5, "F");
    setFont("bold", 9);
    setColor(TEAL);
    doc.text(`${step.step}`, MARGIN + 3.5, y + 8);
    // Connector line
    if (i < (results.conceptFlow || []).length - 1) {
      setDraw(LGRAY);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(MARGIN + 5, y + 11, MARGIN + 5, y + 30);
      doc.setLineDashPattern([], 0);
    }
    setFont("bold", 10);
    setColor(WHITE);
    doc.text(step.title || "", MARGIN + 13, y + 7);
    y += 11;
    setFont("normal", 9);
    setColor(GRAY);
    const expLines = doc.splitTextToSize(step.explanation || "", CONTENT_W - 16);
    doc.text(expLines, MARGIN + 13, y);
    y += expLines.length * 4.5 + 3;
    if (step.keypoint) {
      checkPage(10);
      setFill([10, 35, 32]);
      const kpLines = doc.splitTextToSize(`⚡ ${step.keypoint}`, CONTENT_W - 18);
      doc.roundedRect(MARGIN + 12, y, CONTENT_W - 14, kpLines.length * 4 + 5, 1, 1, "F");
      setFont("bold", 8);
      setColor(TEAL);
      doc.text(kpLines, MARGIN + 15, y + 4.5);
      y += kpLines.length * 4 + 8;
    }
    if (step.reference) {
      setFont("bold", 7);
      setColor(GOLD);
      doc.text(`§ ${step.reference}`, MARGIN + 13, y);
      y += 5;
    }
    y += 4;
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 9 — 7-DAY STUDY PLAN
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;
  sectionBadge("📅  7-DAY REVISION STUDY PLAN", GREEN);

  (results.studyPlan || []).forEach((day) => {
    checkPage(32);
    const pColor = day.priority === "HIGH" ? RED : GOLD;
    setFill(NAVY);
    doc.roundedRect(MARGIN, y, 20, 20, 2, 2, "F");
    setFont("bold", 8);
    setColor(GREEN);
    doc.text("DAY", MARGIN + 4, y + 7);
    setFont("bold", 14);
    setColor(GREEN);
    doc.text(`${day.day}`, MARGIN + 5, y + 16);
    setFont("bold", 10);
    setColor(WHITE);
    doc.text(day.focus || "", MARGIN + 24, y + 7);
    tag(day.duration || "", MARGIN + 24, y + 14, TEAL);
    if (day.priority) tag(day.priority, MARGIN + 55, y + 14, pColor);
    y += 22;
    (day.tasks || []).forEach((t) => bullet(t, 18, GRAY));
    y += 4;
    hLine(LGRAY, 0.2);
  });

  // ══════════════════════════════════════════════════════════
  // LAST PAGE — MIND MAP TEXT REPRESENTATION
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  setFill(DARK);
  doc.rect(0, 0, W, 297, "F");
  y = 20;
  sectionBadge("🧠  MIND MAP — CONCEPT OVERVIEW", GOLD);

  if (results.mindmap) {
    setFont("bold", 13);
    setColor(GOLD);
    doc.text(`◉  ${results.mindmap.center || ""}`, MARGIN, y);
    y += 12;
    (results.mindmap.branches || []).forEach((branch, i) => {
      checkPage(24);
      setFill(NAVY);
      doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1, 1, "F");
      setFont("bold", 10);
      setColor(WHITE);
      doc.text(`  ${["①","②","③","④","⑤","⑥"][i] || "•"}  ${branch.topic || ""}`, MARGIN + 2, y + 6);
      y += 11;
      (branch.subtopics || []).forEach((sub) => {
        checkPage(7);
        setFont("normal", 8);
        setColor(GRAY);
        doc.text(`        ›  ${sub}`, MARGIN + 8, y);
        y += 5.5;
      });
      y += 3;
    });
  }

  // Final footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setFill(DARK);
    doc.rect(0, 290, W, 7, "F");
    setFont("normal", 7);
    setColor(GRAY);
    doc.text(
      `CA NoteMap AI  ·  ${subject}  ·  CA ${attempt}  ·  ${results.title || ""}  ·  Page ${p} of ${totalPages}`,
      MARGIN, 295
    );
    setFill(GOLD);
    doc.rect(0, 294, W, 3, "F");
  }

  // ── Save ────────────────────────────────────────────────
  const filename = `CA_NoteMap_${subject.replace(/\s+/g, "_")}_${(results.title || "Report").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
  return filename;
}

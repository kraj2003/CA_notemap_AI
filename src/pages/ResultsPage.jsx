import { useState } from "react";
import { C, SUBJECTS, TABS } from "../utils/constants";
import { Card, Btn, Tag, GoldDivider, SectionHeader, Locked } from "../components/UI";
import MindMap from "../components/MindMap";
import Flashcard from "../components/Flashcard";
import Quiz from "../components/Quiz";
import { generatePDF } from "../utils/pdfExport";

export default function ResultsPage({ results, subject, attempt, user, onBack, onShowPayment }) {
  const [activeTab, setActiveTab]   = useState("summary");
  const [fcIdx,     setFcIdx]       = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { email, isPremium, isOwner, isTabLocked } = user;
  const subjectColor = SUBJECTS[subject]?.color || C.gold;
  const ownerMode    = isOwner();

  const shareText = `My CA Notes on "${results.title}" — CA NoteMap AI`;
  const waLink    = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const tgLink    = `https://t.me/share/url?url=${encodeURIComponent("https://canotemap.ai")}&text=${encodeURIComponent(shareText)}`;

  const handleDownloadPDF = async () => {
    if (!ownerMode && !isPremium) { onShowPayment(); return; }
    setPdfLoading(true);
    try {
      if (!window.jspdf) {
        // Load jsPDF dynamically
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      await generatePDF(results, subject, attempt, email);
    } catch (e) {
      alert("PDF export failed: " + e.message);
    }
    setPdfLoading(false);
  };

  const locked = (id) => !ownerMode && isTabLocked(id);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>

      {/* Sticky top bar */}
      <div style={{
        background: `${C.surface}f0`, borderBottom: `1px solid ${C.border}`,
        backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMid, cursor: "pointer", fontSize: 13 }}>← New</button>
          <div style={{ width: 1, height: 20, background: C.border }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15, color: C.white, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {results.title}
            </span>
          </div>
          <Tag color={subjectColor}>{SUBJECTS[subject]?.icon} {subject}</Tag>
          <Tag color={C.textMid}>{attempt}</Tag>
          {ownerMode && <Tag color={C.green}>OWNER</Tag>}

          {/* PDF Download */}
          <Btn small variant="outline" loading={pdfLoading} onClick={handleDownloadPDF}>
            {ownerMode || isPremium ? "⬇ Download PDF" : "🔒 PDF Export"}
          </Btn>

          <a href={waLink} target="_blank" rel="noreferrer" style={{ background: "#25D36615", border: "1px solid #25D36630", borderRadius: 7, padding: "5px 11px", color: "#25D366", textDecoration: "none", fontSize: 11, fontWeight: 800 }}>WhatsApp</a>
          <a href={tgLink} target="_blank" rel="noreferrer" style={{ background: "#0088cc15", border: "1px solid #0088cc30", borderRadius: 7, padding: "5px 11px", color: "#0088cc", textDecoration: "none", fontSize: 11, fontWeight: 800 }}>Telegram</a>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSchH-8iOEymeX2w6EJHkAWprEIeoXxE2uAyUaPiDYGzF8Cw-g/viewform"
            target="_blank"
            rel="noreferrer"
            style={{
              background: `${C.gold}15`,
              border: `1px solid ${C.gold}40`,
              borderRadius: 7,
              padding: "5px 11px",
              color: C.gold,
              textDecoration: "none",
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "var(--font-body)",
            }}
          >
            📝 Feedback
          </a>
        </div>

        {/* Tab bar */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? `${subjectColor}18` : "transparent",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? subjectColor : "transparent"}`,
              color: activeTab === tab.id ? subjectColor : C.textMid,
              padding: "9px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700,
              whiteSpace: "nowrap", transition: "all 0.2s", fontFamily: "var(--font-body)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {locked(tab.id) && <span style={{ color: C.textDim, fontSize: 10 }}>🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="fade-up" style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* ── SUMMARY ── */}
        {activeTab === "summary" && (
          <div>
            <SectionHeader title="⚡ 30-Second Quick Recap" subtitle="Read this right before your exam" color={subjectColor} />
            <Card glow style={{ marginBottom: 20 }}>
              <div style={{ borderLeft: `3px solid ${subjectColor}`, paddingLeft: 20 }}>
                <p style={{ color: C.white, fontSize: 16, lineHeight: 1.85, fontWeight: 500 }}>{results.summary30sec}</p>
              </div>
            </Card>

            {results.examFocus && (
              <Card style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.gold}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎯</div>
                  <div>
                    <h4 style={{ color: C.gold, fontSize: 13, fontWeight: 800, letterSpacing: "0.4px", marginBottom: 8 }}>HOW ICAI EXAMINES THIS TOPIC</h4>
                    <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7 }}>{results.examFocus}</p>
                  </div>
                </div>
              </Card>
            )}

            {(results.mnemonics || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: C.textMid, fontSize: 12, fontWeight: 800, letterSpacing: "0.5px", marginBottom: 12 }}>🧩 MEMORY AIDS</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {results.mnemonics.map((m, i) => (
                    <Card key={i} style={{ padding: "16px 18px", background: C.surfaceHi }}>
                      <p style={{ color: C.textMid, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{m.concept}</p>
                      <p style={{ color: subjectColor, fontSize: 20, fontWeight: 900, marginBottom: 8, fontFamily: "var(--font-head)", letterSpacing: "1px" }}>{m.mnemonic}</p>
                      <p style={{ color: C.textMid, fontSize: 12, lineHeight: 1.5 }}>{m.explanation}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {(results.commonMistakes || []).length > 0 && (
              <div>
                <h3 style={{ color: C.textMid, fontSize: 12, fontWeight: 800, letterSpacing: "0.5px", marginBottom: 12 }}>⚠️ COMMON EXAM MISTAKES</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {results.commonMistakes.map((m, i) => (
                    <Card key={i} style={{ padding: "14px 18px", background: `${C.red}08`, borderColor: `${C.red}25` }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span style={{ color: C.red, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✗</span>
                        <div>
                          <p style={{ color: C.red, fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{m.mistake}</p>
                          <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>→ {m.correction}</p>
                          <Tag color={m.frequency === "Very Common" ? C.red : C.gold} style={{ marginTop: 6 }}>{m.frequency}</Tag>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MIND MAP ── */}
        {activeTab === "mindmap" && (
          <div>
            <SectionHeader title="🧠 Concept Mind Map" subtitle="Drag to pan · buttons to zoom" color={subjectColor} />
            <Card><MindMap data={results.mindmap} subjectColor={subjectColor} /></Card>
          </div>
        )}

        {/* ── HIGH WEIGHT TOPICS ── */}
        {activeTab === "topics" && (
          <div>
            <SectionHeader title="🎯 High Weightage Exam Topics" subtitle="Focus on these for maximum marks" color={subjectColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(results.highWeightTopics || []).map((t, i) => (
                <Card key={i} style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${t.importance === "HIGH" ? C.red : C.gold}18`, border: `1px solid ${t.importance === "HIGH" ? C.red : C.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", color: t.importance === "HIGH" ? C.red : C.gold, fontWeight: 900, fontSize: 16, flexShrink: 0, fontFamily: "var(--font-head)" }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.white, fontFamily: "var(--font-head)" }}>{t.topic}</h3>
                        <Tag color={t.importance === "HIGH" ? C.red : C.gold}>{t.importance}</Tag>
                        {t.marks && <Tag color={C.teal}>{t.marks}</Tag>}
                      </div>
                      <p style={{ margin: "0 0 8px", color: C.text, fontSize: 13, lineHeight: 1.6 }}>{t.reason}</p>
                      {t.section && <div style={{ color: subjectColor, fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)" }}>§ {t.section}</div>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── STANDARDS ── */}
        {activeTab === "standards" && (
          <div>
            <SectionHeader title="📜 Standards & Sections" subtitle="ICAI references mapped from your notes" color={subjectColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(results.standards || []).map((s, i) => (
                <Card key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: C.white, fontFamily: "var(--font-head)" }}>{s.name}</h3>
                      <div style={{ display: "flex", gap: 8 }}>
                        {s.number && <Tag color={subjectColor}>{s.number}</Tag>}
                        {s.recentChange && <Tag color={C.gold}>Recent Change</Tag>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    {(s.keypoints || []).map((kp, j) => (
                      <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: subjectColor, flexShrink: 0, fontSize: 12, marginTop: 2 }}>▸</span>
                        <span style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>{kp}</span>
                      </div>
                    ))}
                  </div>
                  {s.examTip && (
                    <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}25`, borderRadius: 9, padding: "9px 14px", marginBottom: 10 }}>
                      <span style={{ color: C.teal, fontSize: 12, fontWeight: 700 }}>🎯 Exam tip: </span>
                      <span style={{ color: C.text, fontSize: 12 }}>{s.examTip}</span>
                    </div>
                  )}
                  {s.recentChange && (
                    <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}25`, borderRadius: 9, padding: "9px 14px" }}>
                      <span style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>🔔 Amendment: </span>
                      <span style={{ color: C.text, fontSize: 12 }}>{s.recentChange}</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── FLASHCARDS ── */}
        {activeTab === "flashcards" && (
          <div>
            <SectionHeader title="🃏 Revision Flashcards" subtitle={`${results.flashcards?.length || 0} cards · click to flip`} color={subjectColor} />
            {locked("flashcards") ? <Locked onUpgrade={onShowPayment} /> : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Easy", "Medium", "Hard"].map((d) => (
                      <Tag key={d} color={d === "Easy" ? C.green : d === "Hard" ? C.red : C.gold}>
                        {d}: {(results.flashcards || []).filter((f) => f.difficulty === d).length}
                      </Tag>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Btn small variant="ghost" onClick={() => setFcIdx((i) => Math.max(0, i - 1))} disabled={fcIdx === 0}>←</Btn>
                    <span style={{ color: C.textMid, fontSize: 13, fontFamily: "var(--font-mono)" }}>
                      {fcIdx + 1}/{results.flashcards?.length || 1}
                    </span>
                    <Btn small variant="ghost" onClick={() => setFcIdx((i) => Math.min((results.flashcards?.length || 1) - 1, i + 1))} disabled={fcIdx >= (results.flashcards?.length || 1) - 1}>→</Btn>
                  </div>
                </div>
                <Flashcard card={(results.flashcards || [])[fcIdx] || {}} index={fcIdx} total={results.flashcards?.length || 0} color={subjectColor} />
                <div style={{ marginTop: 20 }}>
                  <p style={{ color: C.textMid, fontSize: 12, fontWeight: 700, marginBottom: 10, letterSpacing: "0.4px" }}>ALL CARDS:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                    {(results.flashcards || []).map((card, i) => (
                      <div key={i} onClick={() => setFcIdx(i)} style={{ background: fcIdx === i ? `${subjectColor}12` : C.surfaceHi, border: `1px solid ${fcIdx === i ? subjectColor : C.border}`, borderRadius: 10, padding: "11px 15px", cursor: "pointer", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <Tag color={card.difficulty === "Easy" ? C.green : card.difficulty === "Hard" ? C.red : C.gold}>{card.difficulty || "Medium"}</Tag>
                          {card.section && <span style={{ color: subjectColor, fontSize: 10, fontFamily: "var(--font-mono)" }}>{card.section.slice(0, 20)}</span>}
                        </div>
                        <p style={{ color: C.text, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{card.question?.slice(0, 70)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QUIZ ── */}
        {activeTab === "quiz" && (
          <div>
            <SectionHeader title="❓ ICAI-Style MCQ Practice" subtitle={`${results.quiz?.length || 0} questions · ${attempt} level`} color={subjectColor} />
            {locked("quiz") ? <Locked onUpgrade={onShowPayment} /> : (
              <Card><Quiz questions={results.quiz || []} color={subjectColor} /></Card>
            )}
          </div>
        )}

        {/* ── AMENDMENTS ── */}
        {activeTab === "amendments" && (
          <div>
            <SectionHeader title="🔔 Recent Amendments" subtitle="Stay updated with ICAI changes" color={subjectColor} />
            {locked("amendments") ? <Locked onUpgrade={onShowPayment} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(results.amendments || []).map((a, i) => (
                  <Card key={i} style={{ borderColor: a.priority === "HIGH" ? `${C.gold}40` : C.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.white, fontFamily: "var(--font-head)", flex: 1 }}>{a.title}</h3>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Tag color={a.priority === "HIGH" ? C.red : C.gold}>{a.priority}</Tag>
                        <Tag color={C.teal}>{a.effective}</Tag>
                      </div>
                    </div>
                    <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{a.summary}</p>
                    <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}25`, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>📌 Exam Impact: </span>
                      <span style={{ color: C.text, fontSize: 12 }}>{a.impact}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CONCEPT FLOW ── */}
        {activeTab === "flow" && (
          <div>
            <SectionHeader title="🌊 Concept Flow" subtitle="Step-by-step — understand WHY and HOW" color={subjectColor} />
            <div>
              {(results.conceptFlow || []).map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 18, marginBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${subjectColor}18`, border: `2px solid ${subjectColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: subjectColor, fontWeight: 900, fontSize: 15, fontFamily: "var(--font-head)" }}>{step.step}</div>
                    {i < (results.conceptFlow || []).length - 1 && (
                      <div style={{ width: 2, flex: 1, background: `${subjectColor}25`, margin: "6px 0", minHeight: 24 }} />
                    )}
                  </div>
                  <Card style={{ flex: 1, padding: "16px 20px", marginBottom: 0 }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: subjectColor, fontFamily: "var(--font-head)" }}>{step.title}</h3>
                    <p style={{ margin: "0 0 10px", color: C.text, fontSize: 13, lineHeight: 1.7 }}>{step.explanation}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {step.keypoint && (
                        <div style={{ background: `${subjectColor}10`, border: `1px solid ${subjectColor}25`, borderRadius: 7, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <span style={{ color: subjectColor, fontSize: 11 }}>⚡</span>
                          <span style={{ color: subjectColor, fontSize: 12, fontWeight: 700 }}>{step.keypoint}</span>
                        </div>
                      )}
                      {step.reference && (
                        <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}25`, borderRadius: 7, padding: "5px 12px" }}>
                          <span style={{ color: C.teal, fontSize: 11, fontFamily: "var(--font-mono)" }}>§ {step.reference}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STUDY PLAN ── */}
        {activeTab === "plan" && (
          <div>
            <SectionHeader title="📅 7-Day Revision Plan" subtitle="Subject-specific structured schedule" color={subjectColor} />
            {locked("plan") ? <Locked onUpgrade={onShowPayment} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(results.studyPlan || []).map((day, i) => (
                  <Card key={i} style={{ padding: "18px 22px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${subjectColor}18`, border: `1px solid ${subjectColor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, flexDirection: "column" }}>
                        <span style={{ color: subjectColor, fontSize: 10, fontWeight: 800, lineHeight: 1, fontFamily: "var(--font-mono)" }}>DAY</span>
                        <span style={{ color: subjectColor, fontSize: 20, fontWeight: 900, lineHeight: 1, fontFamily: "var(--font-head)" }}>{day.day}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.white, fontFamily: "var(--font-head)" }}>{day.focus}</h3>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Tag color={C.teal}>{day.duration}</Tag>
                            {day.priority && <Tag color={day.priority === "HIGH" ? C.red : C.gold}>{day.priority}</Tag>}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {(day.tasks || []).map((task, j) => (
                            <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ color: subjectColor, fontSize: 12, flexShrink: 0, marginTop: 2 }}>▸</span>
                              <span style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

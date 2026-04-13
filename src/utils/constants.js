// ─── Owner / Admin ────────────────────────────────────────────────────────
export const OWNER_EMAIL = "khushirajpurohit2021@gmail.com";
export const PREMIUM_CODES = ["PAID99", "CA2024", "ADMIN"];

// ─── Free Tier Limits ─────────────────────────────────────────────────────
export const FREE_GENERATIONS = 5;
export const FREE_PDF_UPLOADS = 5;
export const FREE_WORD_LIMIT = 1500;

// ─── Colors ───────────────────────────────────────────────────────────────
export const C = {
  bg:        "#080C10",
  bgAlt:     "#0D1117",
  surface:   "#111820",
  surfaceHi: "#161E28",
  border:    "#1E2D3D",
  borderHi:  "#2A3F54",
  gold:      "#C9A84C",
  goldLight: "#E8C97A",
  goldDim:   "#8A6E32",
  goldGlow:  "rgba(201,168,76,0.12)",
  teal:      "#0EA5A0",
  tealDim:   "rgba(14,165,160,0.15)",
  red:       "#E05252",
  green:     "#3DB88A",
  blue:      "#4A9EDB",
  text:      "#D4C9B8",
  textMid:   "#8A9BAC",
  textDim:   "#3D4F5E",
  white:     "#F0EBE0",
};

// ─── CA Subjects ──────────────────────────────────────────────────────────
export const SUBJECTS = {
  "Financial Reporting":   { icon: "📊", color: "#4A9EDB", desc: "IndAS, IFRS, Consolidation, Valuation" },
  "Advanced Auditing":     { icon: "🔍", color: "#0EA5A0", desc: "Standards on Auditing, Reporting, Ethics" },
  "Direct Tax":            { icon: "🏛️", color: "#C9A84C", desc: "Income Tax Act, Assessment, Appeals" },
  "Indirect Tax":          { icon: "📋", color: "#A78BFA", desc: "GST, Customs, FTP" },
  "Corporate Law":         { icon: "⚖️", color: "#E05252", desc: "Companies Act, SEBI, FEMA, IBC" },
  "Strategic FM":          { icon: "📈", color: "#3DB88A", desc: "Financial Management, Derivatives, Risk" },
  "Cost Accounting":       { icon: "🧮", color: "#FB923C", desc: "Standard Costing, Budgeting, Decisions" },
  "Strategic Management":  { icon: "♟️", color: "#60A5FA", desc: "Business Strategy, BCG, Porter" },
};

// ─── Output Tabs ──────────────────────────────────────────────────────────
export const TABS = [
  { id: "summary",     icon: "⚡", label: "Quick Recap",   locked: false },
  { id: "mindmap",     icon: "🧠", label: "Mind Map",      locked: false },
  { id: "topics",      icon: "🎯", label: "Exam Topics",   locked: false },
  { id: "standards",   icon: "📜", label: "Standards",     locked: false },
  { id: "pyq",         icon: "📋", label: "PYQs",          locked: false },
  { id: "flashcards",  icon: "🃏", label: "Flash Cards",   locked: true  },
  { id: "quiz",        icon: "❓", label: "MCQ Quiz",      locked: true  },
  { id: "amendments",  icon: "🔔", label: "Amendments",    locked: true  },
  { id: "flow",        icon: "🌊", label: "Concept Flow",  locked: false },
  { id: "plan",        icon: "📅", label: "Study Plan",    locked: true  },
];

// ─── Loading Messages ─────────────────────────────────────────────────────
export const LOAD_MSGS = [
  "Reading your CA notes...",
  "Identifying ICAI standards...",
  "Mapping IndAS / SA references...",
  "Building concept connections...",
  "Generating exam-focused MCQs...",
  "Creating revision flashcards...",
  "Drafting 7-day study plan...",
  "Detecting recent amendments...",
  "Writing concept flow...",
  "Finalising your study package...",
];

// ─── Sample Topics per Subject ────────────────────────────────────────────
export const SAMPLE_TOPICS = {
  "Direct Tax":           ["Section 43B Deductions", "Capital Gains Sec 45", "TDS Provisions", "MAT Computation", "Bonus Stripping"],
  "Financial Reporting":  ["IndAS 16 PPE", "Revenue Recognition IndAS 115", "Lease Accounting IndAS 116", "Business Combinations IndAS 103", "Impairment IndAS 36"],
  "Indirect Tax":         ["Input Tax Credit GST", "Place of Supply Rules", "GST Registration", "Reverse Charge Mechanism", "Composition Scheme"],
  "Corporate Law":        ["Section 184 Disclosure", "NCLT Proceedings", "Insider Trading SEBI", "IBC Resolution Process", "Director Duties Sec 166"],
  "Advanced Auditing":    ["SA 315 Risk Assessment", "SA 700 Audit Report", "Forensic Audit", "CARO 2020", "Peer Review Process"],
  "Strategic FM":         ["Derivatives Valuation", "Portfolio Theory", "Capital Structure", "Risk Management", "Forex Hedging"],
  "Cost Accounting":      ["Standard Costing Variances", "Marginal Costing", "Activity Based Costing", "Transfer Pricing", "Linear Programming"],
  "Strategic Management": ["BCG Matrix", "Porter Five Forces", "SWOT Analysis", "Balanced Scorecard", "Blue Ocean Strategy"],
};

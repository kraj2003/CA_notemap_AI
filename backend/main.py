"""
CA NoteMap AI — FastAPI Backend v3
====================================
Splits generation into 2 API calls to avoid JSON truncation at 4096 tokens.

Setup:
  cd backend
  python -m venv venv
  venv\\Scripts\\activate        # Windows
  source venv/bin/activate       # Mac/Linux
  pip install fastapi uvicorn groq python-multipart
  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from groq import Groq
import json, re, traceback
import os 

# ═══════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════

GROQ_API_KEY  = os.getenv("GROQ_API_KEY")  # ← paste your key
OWNER_EMAIL   = "khushirajpurohit2021@gmail.com"
PREMIUM_CODES = ["PAID99", "CA2024", "ADMIN"]

FREE_WORD_LIMIT    = 1000
PREMIUM_WORD_LIMIT = 3000

# ═══════════════════════════════════════════════════════════
# SUBJECT GUIDES
# ═══════════════════════════════════════════════════════════

SUBJECT_GUIDES = {
    "Financial Reporting": (
        "Focus on IndAS numbers (IndAS 16, 115, 116, 103, 36, 109). "
        "Include measurement principles, journal entry logic, disclosures. "
        "ICAI tests: presentation, measurement, consolidation eliminations, deferred tax. "
        "Key traps: transition adjustments, FV through OCI, SPPI test, ECL model."
    ),
    "Advanced Auditing": (
        "Reference SA numbers precisely (SA 315, 700, 706, 570, 600, 701, 240). "
        "Include ICAI Code of Ethics, independence, risk-based audit approach. "
        "ICAI tests: report modifications, KAM, CARO 2020, UDIN, NFRA. "
        "Key traps: emphasis of matter vs modified opinion, CARO applicability."
    ),
    "Direct Tax": (
        "Reference exact Income Tax Act 1961 section numbers (e.g. Section 43B, 45, 80IC). "
        "Include AY 2024-25/2025-26 context, CBDT circulars, Finance Act amendments. "
        "ICAI tests: computation problems, scenario-based questions. "
        "Key traps: year of taxability, allowability conditions, clubbing, MAT Section 115JB."
    ),
    "Indirect Tax": (
        "Reference CGST Act 2017 sections precisely (Section 16, 17(5), 10-14, 15, 73-74). "
        "Include IGST Act, GST Council notifications, customs duty. "
        "ICAI tests: ITC eligibility, place of supply, time of supply, valuation. "
        "Key traps: composite vs mixed supply, blocked credits, ITC reversal on capital goods."
    ),
    "Corporate Law": (
        "Reference Companies Act 2013 sections precisely (Section 149-166, 184-188, 230-240). "
        "Include SEBI LODR, ICDR, Insider Trading, IBC 2016, FEMA. "
        "ICAI tests: scenario-based board/shareholder resolutions, NCLT matters. "
        "Key traps: threshold limits, approval hierarchy, private vs public applicability."
    ),
    "Strategic FM": (
        "Focus on numerical application: Black-Scholes, CAPM, MM theorem, Binomial model. "
        "Include formulae with variable definitions, step-by-step computation. "
        "ICAI tests: derivatives, portfolio management (Sharpe/Treynor/Jensen), M&A valuation. "
        "Key traps: annualized vs period returns, continuous vs discrete compounding."
    ),
    "Cost Accounting": (
        "Focus on standard costing variances with exact formulae. "
        "Include marginal vs absorption costing reconciliation, CAS standards. "
        "ICAI tests: variance analysis, decision making, budgetary control, LP. "
        "Key traps: fixed vs variable overhead variance, sales mix vs quantity variance."
    ),
    "Strategic Management": (
        "Apply frameworks to CA case scenarios: Porter Five Forces, BCG, Ansoff, "
        "Balanced Scorecard (Kaplan & Norton), McKinsey 7S, PESTLE, SWOT+TOWS. "
        "ICAI tests: case study application, strategy evaluation, ESG, digital transformation. "
        "Key traps: corporate vs business vs functional strategy, emergent vs deliberate."
    ),
}

ATTEMPT_CONTEXT = {
    "Foundation":     "Simple language, basic concepts, straightforward 1-mark MCQs, 2-3 hours/day study.",
    "Intermediate":   "Balance theory and application, mix of descriptive and numerical, medium MCQs, 3-4 hours/day.",
    "Final":          "Advanced application, case studies, challenging tricky MCQs, 4-6 hours/day intensive revision.",
}

# ═══════════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════════

app = FastAPI(title="CA NoteMap AI API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
    expose_headers=["*"],
    max_age=3600,
)

client = Groq(api_key=GROQ_API_KEY)

# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class GenerateRequest(BaseModel):
    subject: str
    attempt: str
    notes: str
    email: str = ""
    is_premium: bool = False

# ═══════════════════════════════════════════════════════════
# JSON PARSER
# ═══════════════════════════════════════════════════════════

def parse_json(text: str) -> dict:
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()
    s = text.find("{")
    e = text.rfind("}") + 1
    if s == -1 or e == 0:
        raise ValueError("No JSON object found in response")
    raw = text[s:e]
    # Fix trailing commas
    raw = re.sub(r",\s*([}\]])", r"\1", raw)
    return json.loads(raw)


def call_groq(user_prompt: str, max_tokens: int = 3000) -> dict:
    system = (
        "You are a JSON-only API for CA exam preparation. "
        "Respond with ONLY valid JSON. "
        "No markdown fences, no explanation, no extra text. "
        "Start your response with { and end with }."
    )
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=max_tokens,
        top_p=0.9,
    )
    return parse_json(response.choices[0].message.content)

# ═══════════════════════════════════════════════════════════
# PROMPT BUILDERS
# Split into Part A (core) and Part B (practice)
# Each returns ~2500 tokens max — well within 3000 limit
# ═══════════════════════════════════════════════════════════

def prompt_part_a(subject: str, attempt: str, notes: str) -> str:
    guide   = SUBJECT_GUIDES.get(subject, "")
    att_ctx = ATTEMPT_CONTEXT.get(attempt, ATTEMPT_CONTEXT["Final"])
    return f"""CA exam coach for {subject}, CA {attempt}.
Subject: {guide}
Level: {att_ctx}
Notes: \"\"\"{notes}\"\"\"

Return this JSON only:
{{
  "title": "topic title max 6 words",
  "summary30sec": "3-4 exam-focused sentences with exact section refs",
  "examFocus": "how ICAI examines this: question types, marks, traps",
  "highWeightTopics": [
    {{"topic":"name","importance":"HIGH or MEDIUM","reason":"why tested","section":"exact ref","marks":"typical marks"}}
  ],
  "mindmap": {{
    "center": "core topic 3-4 words",
    "branches": [
      {{"topic":"branch name","subtopics":["sub1","sub2","sub3"]}}
    ]
  }},
  "standards": [
    {{"name":"full name","number":"ref","keypoints":["p1","p2","p3"],"examTip":"how tested","recentChange":"amendment or null"}}
  ],
  "conceptFlow": [
    {{"step":1,"title":"title","explanation":"2 lines why and how","keypoint":"exam-critical point","reference":"ref or null"}}
  ]
}}

Limits: highWeightTopics 4-5, mindmap.branches 5 each with exactly 3 subtopics, standards 3-4, conceptFlow 5."""

def prompt_part_b(subject: str, attempt: str, notes: str, title: str) -> str:
    guide   = SUBJECT_GUIDES.get(subject, "")
    att_ctx = ATTEMPT_CONTEXT.get(attempt, ATTEMPT_CONTEXT["Final"])
    return f"""CA exam coach for {subject}, CA {attempt}. Topic: {title}
Subject: {guide}
Level: {att_ctx}
Notes: \"\"\"{notes}\"\"\"

Return this JSON only:
{{
  "flashcards": [
    {{"question":"question","answer":"answer with section ref","section":"ref or null","difficulty":"Easy or Medium or Hard"}}
  ],
  "quiz": [
    {{"question":"MCQ question","options":["opt A","opt B","opt C","opt D"],"correct":"exact text of correct option","explanation":"why correct + section","section":"ref or null","marks":"1 or 2"}}
  ],
  "amendments": [
    {{"title":"title","effective":"date/attempt","summary":"what changed","impact":"exam impact","priority":"HIGH or MEDIUM"}}
  ],
  "studyPlan": [
    {{"day":1,"focus":"focus area","tasks":["task1","task2","task3"],"duration":"X hours","priority":"HIGH or MEDIUM"}}
  ],
  "mnemonics": [
    {{"concept":"what to remember","mnemonic":"THE MNEMONIC","explanation":"how to use it"}}
  ],
  "commonMistakes": [
    {{"mistake":"what students do wrong","correction":"correct approach with rule","frequency":"Very Common or Common"}}
  ]
}}

Limits: flashcards 8 (3 Easy 3 Medium 2 Hard), quiz 6 (correct MUST match option text exactly), amendments 3, studyPlan exactly 7 days, mnemonics 3, commonMistakes 4."""

# ═══════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════

@app.options("/api/generate")
async def options_generate(request: Request):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept",
        }
    )
@app.get("/")
def root():
    return {"status": "CA NoteMap API running", "version": "3.0.0"}

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "groq_configured": GROQ_API_KEY != "gsk_your_groq_api_key_here",
        "subjects": list(SUBJECT_GUIDES.keys()),
    }

@app.post("/api/generate")
def generate(req: GenerateRequest):

    # ── Validate ────────────────────────────────────────
    if not req.notes or len(req.notes.strip()) < 40:
        raise HTTPException(400, "Notes too short. Minimum 40 characters.")
    if req.subject not in SUBJECT_GUIDES:
        raise HTTPException(400, f"Invalid subject. Choose: {list(SUBJECT_GUIDES.keys())}")
    if req.attempt not in ATTEMPT_CONTEXT:
        raise HTTPException(400, "Invalid attempt. Use: Foundation, Intermediate, Final")

    # ── Trim notes ───────────────────────────────────────
    is_owner   = req.email.lower().strip() == OWNER_EMAIL.lower()
    is_premium = req.is_premium or is_owner
    limit      = PREMIUM_WORD_LIMIT if is_premium else FREE_WORD_LIMIT
    notes      = " ".join(req.notes.strip().split()[:limit])

    print(f"\n📥 {req.subject} | {req.attempt} | {req.email or 'anon'} | {len(notes.split())} words")

    # ── CALL 1 — Core (title, summary, mindmap, standards, flow) ──
    part_a = None
    for n in range(2):
        try:
            print(f"  🔄 Call 1 (attempt {n+1})...")
            part_a = call_groq(prompt_part_a(req.subject, req.attempt, notes), max_tokens=3000)
            print(f"  ✅ Call 1 done — '{part_a.get('title','?')}'")
            break
        except Exception as e:
            print(f"  ❌ Call 1 fail {n+1}: {e}")
            if n == 1:
                raise HTTPException(500, f"Core generation failed: {str(e)}")

    # ── CALL 2 — Practice (flashcards, quiz, plan, mnemonics) ──
    title  = part_a.get("title", req.subject)
    part_b = {}
    for n in range(2):
        try:
            print(f"  🔄 Call 2 (attempt {n+1})...")
            part_b = call_groq(prompt_part_b(req.subject, req.attempt, notes, title), max_tokens=3000)
            print(f"  ✅ Call 2 done — {len(part_b.get('quiz',[]))} quiz items")
            break
        except Exception as e:
            print(f"  ❌ Call 2 fail {n+1}: {e}")
            if n == 1:
                print("  ⚠️  Returning partial result")
                part_b = {
                    "flashcards": [], "quiz": [], "amendments": [],
                    "studyPlan": [], "mnemonics": [], "commonMistakes": [],
                }

    # ── Merge and return ─────────────────────────────────
    result = {**part_a, **part_b}
    result.setdefault("examFocus", "")
    result.setdefault("highWeightTopics", [])
    result.setdefault("mindmap", {"center": title, "branches": []})
    result.setdefault("standards", [])
    result.setdefault("conceptFlow", [])
    print(f"  🎉 Complete: {title}")
    return result


@app.post("/api/verify-payment")
def verify_payment(body: dict):
    code  = body.get("code", "").upper().strip()
    email = body.get("email", "").lower().strip()
    if code in PREMIUM_CODES or email == OWNER_EMAIL.lower():
        return {"success": True, "is_premium": True, "message": "Premium activated!"}
    raise HTTPException(400, "Invalid code. Try PAID99.")


@app.get("/api/subjects")
def get_subjects():
    return {"subjects": list(SUBJECT_GUIDES.keys())}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
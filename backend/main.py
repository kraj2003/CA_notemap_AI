"""
CA NoteMap AI — FastAPI Backend v4
====================================
WHAT CHANGED FROM v3:
  - Supabase database replaces in-memory premium_emails set
  - /api/check-premium reads from DB (survives server restarts)
  - /api/razorpay-webhook verifies signature + activates premium in DB
  - /api/increment-gen increments server-side gen counter
  - /api/verify-razorpay kept for manual fallback verification
  - All manual premium codes REMOVED

ENVIRONMENT VARIABLES NEEDED (add to Render):
  GROQ_API_KEY              — from console.groq.com
  SUPABASE_URL              — from supabase.com project settings
  SUPABASE_SERVICE_KEY      — service_role key (NOT anon)
  RAZORPAY_KEY_ID           — from razorpay.com Settings > API Keys
  RAZORPAY_KEY_SECRET       — from razorpay.com Settings > API Keys
  RAZORPAY_WEBHOOK_SECRET   — string you set in Razorpay webhook settings

SUPABASE TABLE REQUIRED:
  Run this SQL in Supabase SQL Editor once:

  create table users (
    id                   uuid default gen_random_uuid() primary key,
    email                text unique not null,
    is_premium           boolean default false,
    free_gens_used       integer default 0,
    free_pdfs_used       integer default 0,
    razorpay_payment_id  text,
    premium_activated_at timestamptz,
    referral_code        text unique,
    referred_by          text,
    referral_bonus_gens  integer default 0,
    created_at           timestamptz default now()
  );
  create index users_email_idx on users(email);
  alter table users enable row level security;

Setup:
  pip install fastapi uvicorn groq python-multipart httpx supabase
  uvicorn main:app --reload --port 8000
"""


from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from groq import Groq
from supabase import create_client, Client
import json, re, traceback, os, hmac, hashlib
import random, string

# ═══════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════

GROQ_API_KEY          = os.getenv("GROQ_API_KEY")
OWNER_EMAIL           = "khushirajpurohit2021@gmail.com"

SUPABASE_URL          = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_KEY")

RAZORPAY_KEY_ID       = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET   = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WH_SECRET    = os.getenv("RAZORPAY_WEBHOOK_SECRET")

FREE_WORD_LIMIT       = 1500
PREMIUM_WORD_LIMIT    = 4000
FREE_GENERATIONS      = 5

# ═══════════════════════════════════════════════════════════
# SUBJECT GUIDES (unchanged from v3)
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
    "Foundation":   "Simple language, basic concepts, 1-mark MCQs, 2-3 hours/day study.",
    "Intermediate": "Balance theory and application, mix of descriptive and numerical, 3-4 hours/day.",
    "Final":        "Advanced application, case studies, tricky MCQs, 4-6 hours/day intensive revision.",
}

# ═══════════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════════

app = FastAPI(title="CA NoteMap AI API", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
    expose_headers=["*"],
    max_age=3600,
)

# Clients
groq_client = Groq(api_key=GROQ_API_KEY)
db: Client  = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_URL else None

# ═══════════════════════════════════════════════════════════
# DATABASE HELPERS
# ═══════════════════════════════════════════════════════════

def make_referral_code():
    """Generate a unique 6-character referral code."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

def get_user(email: str) -> dict | None:
    """Get user record from Supabase. Returns None if not found."""
    if not db:
        return None
    try:
        res = db.table("users").select("*").eq("email", email).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"DB get_user error: {e}")
        return None

def upsert_user(email: str, updates: dict) -> dict | None:
    """Create or update a user record."""
    if not db:
        return None
    try:
        existing = get_user(email)
        if existing:
            db.table("users").update(updates).eq("email", email).execute()
            return {**existing, **updates}
        else:
            # New user — generate referral code
            new_record = {
                "email": email,
                "referral_code": make_referral_code(),
                **updates
            }
            db.table("users").insert(new_record).execute()
            return new_record
    except Exception as e:
        print(f"DB upsert_user error: {e}")
        return None

# ═══════════════════════════════════════════════════════════
# JSON PARSER
# ═══════════════════════════════════════════════════════════

def parse_json(text: str) -> dict:
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*",     "", text)
    text = text.strip()
    s = text.find("{")
    e = text.rfind("}") + 1
    if s == -1 or e == 0:
        raise ValueError("No JSON object found in response")
    raw = text[s:e]
    raw = re.sub(r",\s*([}\]])", r"\1", raw)
    return json.loads(raw)

def call_groq(user_prompt: str, max_tokens: int = 3000) -> dict:
    system = (
        "You are a JSON-only API for CA exam preparation. "
        "Respond with ONLY valid JSON. "
        "No markdown fences, no explanation, no extra text. "
        "Start your response with { and end with }."
    )
    response = groq_client.chat.completions.create(
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
# PROMPT BUILDERS (unchanged from v3)
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


 
class GenerateRequest(BaseModel):
    subject:    str
    attempt:    str
    notes:      str
    email:      str = ""
    is_premium: bool = False

@app.get("/")
def root():
    return {"status": "CA NoteMap API running", "version": "4.0.0"}

@app.get("/api/health")
@app.get("/health")
def health():
    return {
        "status": "ok",
        "db_connected": db is not None,
        "subjects": list(SUBJECT_GUIDES.keys()),
    }

# ── Check Premium ────────────────────────────────────────────────────────────
@app.post("/api/check-premium")
def check_premium(body: dict):
    """
    Called by frontend when user enters email.
    Returns premium status and gen count from database.
    Creates user record on first visit.
    """
    email = body.get("email", "").lower().strip()
    if not email:
        raise HTTPException(400, "Email required")

    # Owner always gets premium
    if email == OWNER_EMAIL.lower():
        return {"is_premium": True, "free_gens_used": 0, "referral_code": None}

    user = upsert_user(email, {})  # creates if not exists, returns existing if exists
    if not user:
        # DB unavailable — return default (localStorage is fallback)
        return {"is_premium": False, "free_gens_used": 0, "referral_code": None}

    return {
        "is_premium":      user.get("is_premium", False),
        "free_gens_used":  user.get("free_gens_used", 0),
        "referral_code":   user.get("referral_code"),
    }

# ── Increment Generation ─────────────────────────────────────────────────────
@app.post("/api/increment-gen")
def increment_gen(body: dict):
    """
    Called after each generation for free users.
    Increments server-side counter (prevents localStorage manipulation).
    """
    email = body.get("email", "").lower().strip()
    if not email or email == OWNER_EMAIL.lower():
        return {"ok": True}

    user = get_user(email)
    if user and not user.get("is_premium"):
        new_count = user.get("free_gens_used", 0) + 1
        upsert_user(email, {"free_gens_used": new_count})

    return {"ok": True}

# ── Razorpay Webhook ─────────────────────────────────────────────────────────
@app.post("/api/razorpay-webhook")
async def razorpay_webhook(request: Request):
    """
    Razorpay calls this automatically when payment is captured.
    Verifies the signature (proves it's really from Razorpay),
    then marks the user as premium in Supabase.

    SETUP in Razorpay dashboard:
      Settings → Webhooks → Add webhook
      URL: https://ca-notemap-ai.onrender.com/api/razorpay-webhook
      Secret: (set RAZORPAY_WEBHOOK_SECRET in Render env vars to match)
      Events: payment.captured
    """
    body = await request.body()
    sig  = request.headers.get("X-Razorpay-Signature", "")

    # Always verify signature — reject fakes
    if RAZORPAY_WH_SECRET:
        expected = hmac.new(
            RAZORPAY_WH_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected, sig):
            print("⚠️  Razorpay webhook: invalid signature — rejected")
            raise HTTPException(400, "Invalid signature")

    data    = json.loads(body)
    event   = data.get("event", "")

    print(f"📩 Razorpay event: {event}")

    if event == "payment.captured":
        payment = data["payload"]["payment"]["entity"]
        email   = payment.get("email", "").lower().strip()
        pid     = payment.get("id", "")
        amount  = payment.get("amount", 0)
        status  = payment.get("status", "")

        print(f"   Payment: {pid} | Email: {email} | Amount: {amount} | Status: {status}")

        # Verify amount ≥ ₹99 (9900 paise) — reject partial payments
        if email and amount >= 9900 and status == "captured":
            upsert_user(email, {
                "is_premium":           True,
                "razorpay_payment_id":  pid,
                "premium_activated_at": "now()",
            })
            print(f"   ✅ Premium activated for: {email}")
        else:
            print(f"   ⚠️  Payment not eligible: amount={amount}, status={status}")

    return {"status": "ok"}

# ── Manual Razorpay Verify (fallback) ────────────────────────────────────────
@app.post("/api/verify-razorpay")
async def verify_razorpay(body: dict):
    """
    Fallback: called by frontend if user lands back without webhook firing.
    Verifies a specific payment_id directly with Razorpay API.
    """
    import httpx

    payment_id = body.get("razorpay_payment_id", "")
    email      = body.get("email", "").lower().strip()

    if not payment_id or not email:
        raise HTTPException(400, "Missing payment_id or email")

    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(500, "Razorpay not configured")

    # Call Razorpay API to verify
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://api.razorpay.com/v1/payments/{payment_id}",
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
        )

    if r.status_code != 200:
        raise HTTPException(400, "Invalid payment ID")

    data   = r.json()
    status = data.get("status", "")
    amount = data.get("amount", 0)

    if status != "captured":
        raise HTTPException(400, f"Payment status is '{status}', not captured")
    if amount < 9900:
        raise HTTPException(400, f"Amount ₹{amount/100} is less than ₹99")

    # Activate premium
    upsert_user(email, {
        "is_premium":           True,
        "razorpay_payment_id":  payment_id,
        "premium_activated_at": "now()",
    })

    print(f"✅ Manual verify: premium activated for {email}")
    return {"success": True, "message": "Premium activated!"}

# ── Generate ─────────────────────────────────────────────────────────────────
@app.options("/api/generate")
async def options_generate(request: Request):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin":  "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept",
        }
    )
 
@app.post("/api/generate")
def generate(req: GenerateRequest):  # ← now properly typed
    # Validate
    if not req.notes or len(req.notes.strip()) < 40:
        raise HTTPException(400, "Notes too short. Minimum 40 characters.")
    if req.subject not in SUBJECT_GUIDES:
        raise HTTPException(400, "Invalid subject.")
    if req.attempt not in ATTEMPT_CONTEXT:
        raise HTTPException(400, "Invalid attempt.")
 
    # Check premium from DB (authoritative source of truth)
    is_owner    = req.email.lower().strip() == OWNER_EMAIL.lower()
    user_record = get_user(req.email.lower().strip()) if req.email else None
    is_premium  = is_owner or (user_record and user_record.get("is_premium", False)) or req.is_premium
 
    limit = PREMIUM_WORD_LIMIT if is_premium else FREE_WORD_LIMIT
    notes = " ".join(req.notes.strip().split()[:limit])
 
    print(f"\n📥 {req.subject} | {req.attempt} | {req.email or 'anon'} | {len(notes.split())} words | premium={is_premium}")
 
    # Call 1 — Core content (mindmap, standards, topics, flow)
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
 
    # Call 2 — Practice content (flashcards, quiz, plan, mnemonics)
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
                part_b = {
                    "flashcards": [], "quiz": [], "amendments": [],
                    "studyPlan": [], "mnemonics": [], "commonMistakes": [],
                }
 
    # Merge both parts
    result = {**part_a, **part_b}
    result.setdefault("examFocus", "")
    result.setdefault("highWeightTopics", [])
    result.setdefault("mindmap", {"center": title, "branches": []})
    result.setdefault("standards", [])
    result.setdefault("conceptFlow", [])
 
    print(f"  🎉 Complete: {title}")
    return result
# ── Subjects ──────────────────────────────────────────────────────────────────
@app.get("/api/subjects")
def get_subjects():
    return {"subjects": list(SUBJECT_GUIDES.keys())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
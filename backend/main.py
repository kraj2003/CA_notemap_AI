from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import json, re
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paste your Groq API key here ──────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# "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"
client = Groq(api_key=GROQ_API_KEY)

class GenerateRequest(BaseModel):
    subject: str
    attempt: str
    notes: str

@app.post("/api/generate")
def generate(req: GenerateRequest):
    prompt = f"""You are an elite CA exam coach specializing in {req.subject} for CA {req.attempt}.
Analyze these student notes and return ONLY valid JSON. Start with {{ end with }}. No markdown.

NOTES: \"\"\"{req.notes[:3000]}\"\"\"

{{
  "title": "topic title max 6 words",
  "summary30sec": "3-4 punchy sentences with key section refs",
  "examFocus": "how ICAI examines this topic, marks pattern",
  "highWeightTopics": [
    {{"topic":"name","importance":"HIGH","reason":"why ICAI tests this","section":"Sec/IndAS ref","marks":"marks"}}
  ],
  "mindmap": {{
    "center": "core topic 3-4 words",
    "branches": [
      {{"topic":"branch name","subtopics":["sub1","sub2","sub3"]}}
    ]
  }},
  "standards": [
    {{"name":"Standard name","number":"ref number","keypoints":["point1","point2","point3"],"examTip":"how tested","recentChange":"amendment or null"}}
  ],
  "flashcards": [
    {{"question":"question","answer":"answer with section ref","section":"ref or null","difficulty":"Easy or Medium or Hard"}}
  ],
  "quiz": [
    {{"question":"MCQ question","options":["A text","B text","C text","D text"],"correct":"exact correct option text","explanation":"why correct","section":"ref or null","marks":"1 or 2"}}
  ],
  "amendments": [
    {{"title":"amendment title","effective":"date","summary":"what changed","impact":"exam impact","priority":"HIGH or MEDIUM"}}
  ],
  "conceptFlow": [
    {{"step":1,"title":"step title","explanation":"2 lines why and how","keypoint":"key takeaway","reference":"section or null"}}
  ],
  "studyPlan": [
    {{"day":1,"focus":"focus area","tasks":["task1","task2","task3"],"duration":"2 hours","priority":"HIGH or MEDIUM"}}
  ],
  "mnemonics": [
    {{"concept":"what to remember","mnemonic":"memory device","explanation":"how to use it"}}
  ],
  "commonMistakes": [
    {{"mistake":"wrong approach","correction":"correct approach","frequency":"Very Common or Common"}}
  ]
}}

Rules:
- highWeightTopics: 4-6 items
- mindmap.branches: 5-6 items, each exactly 3 subtopics
- standards: 3-5 items
- flashcards: 8-10 items
- quiz: 7-8 items, correct MUST match one of the 4 options exactly
- amendments: 3-5 items
- conceptFlow: 5-7 steps
- studyPlan: exactly 7 days
- mnemonics: 3-4 items
- commonMistakes: 3-5 items"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a JSON-only API. Respond with ONLY valid JSON. No markdown, no explanation."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.4,
        max_tokens=4096,
    )

    text = response.choices[0].message.content
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text).strip()
    s = text.find('{')
    e = text.rfind('}') + 1
    return json.loads(text[s:e])

@app.get("/")
def root():
    return {"status": "CA NoteMap API running"}
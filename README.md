# 📊 CA NoteMap AI

> AI-powered study assistant **specialized for Chartered Accountancy students**
> Built with React + Vite · Powered by Claude AI

---

## 🗂️ Project Structure

```
ca-notemap/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/         # Reusable UI pieces
│   │   ├── UI.jsx          # Btn, Card, Tag, Spinner, PayModal, etc.
│   │   ├── MindMap.jsx     # Interactive SVG mind map
│   │   ├── Flashcard.jsx   # Flip-card flashcard
│   │   └── Quiz.jsx        # MCQ quiz with scoring
│   ├── hooks/
│   │   └── useUser.js      # User state, limits, premium logic
│   ├── pages/
│   │   ├── HeroPage.jsx    # Landing + email gate
│   │   ├── SubjectPage.jsx # CA subject + attempt selector
│   │   ├── InputPage.jsx   # Notes input + PDF upload
│   │   ├── LoadingPage.jsx # Generation progress screen
│   │   └── ResultsPage.jsx # All 9 output tabs
│   ├── utils/
│   │   ├── constants.js    # Colors, subjects, tabs, config
│   │   ├── ai.js           # Claude API call + prompt builder
│   │   └── pdfExport.js    # jsPDF full report generator
│   ├── styles/
│   │   └── global.css      # CSS variables, animations, base styles
│   ├── App.jsx             # Main orchestrator
│   └── main.jsx            # React entry point
├── index.html              # HTML shell with CDN scripts
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 How to Run

### Prerequisites
- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- Internet connection (for Google Fonts + Claude API)

### Steps

```bash
# 1. Open terminal in the project folder
cd ca-notemap

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser. The app runs instantly.

> **No API key needed.** The app calls the Anthropic API through Claude's
> artifact environment automatically. No `.env` file required.

---

## 👑 Owner Access

Email **`khushirajpurohit2021@gmail.com`** gets:
- ✅ Unlimited generations (no counter)
- ✅ Unlimited PDF uploads
- ✅ All 9 features unlocked
- ✅ Full PDF report download
- ✅ "OWNER · Unlimited" badge shown

This is hardcoded in `src/utils/constants.js` and enforced in `src/hooks/useUser.js`.

---

## 💰 Free vs Premium

| Feature               | Free (5 gen, 5 PDF) | Premium ₹99/mo | Owner |
|-----------------------|---------------------|----------------|-------|
| Mind Map              | ✅                  | ✅             | ✅    |
| Quick Recap           | ✅                  | ✅             | ✅    |
| Exam Topics           | ✅                  | ✅             | ✅    |
| Standards & Sections  | ✅                  | ✅             | ✅    |
| Concept Flow          | ✅                  | ✅             | ✅    |
| Flashcards 🔒         | ❌                  | ✅             | ✅    |
| MCQ Quiz 🔒           | ❌                  | ✅             | ✅    |
| Amendments 🔒         | ❌                  | ✅             | ✅    |
| Study Plan 🔒         | ❌                  | ✅             | ✅    |
| PDF Download 🔒       | ❌                  | ✅             | ✅    |

**Premium codes** (to test): `PAID99` or `CA2024`

Usage counts persist across sessions via `localStorage`.

---

## 📄 PDF Export

After generation, click **⬇ Download PDF** (top bar in results).

The PDF includes:
1. Cover page with topic, subject, date
2. 30-Second Quick Recap
3. Exam Focus strategy
4. Mnemonics & Common Mistakes
5. High Weightage Topics with section refs
6. Standards & Sections Reference
7. All Flashcards (Q&A format)
8. MCQ Quiz with answers highlighted
9. Recent Amendments
10. Concept Flow steps
11. 7-Day Study Plan
12. Mind Map text representation

**Note:** PDF export requires Premium or Owner access.

---

## 📂 PDF Upload

- Supports `.pdf` files up to 10 MB
- Drag & drop or click to browse
- Up to 20 pages extracted automatically
- Text extraction uses PDF.js (loaded from CDN)
- Free users: 5 uploads total
- Premium/Owner: unlimited

---

## 🎨 Tech Stack

| Layer     | Tech                              |
|-----------|-----------------------------------|
| Framework | React 18 + Vite 5                 |
| Styling   | Pure CSS-in-JS (no Tailwind)      |
| Fonts     | Playfair Display, Mulish, JetBrains Mono |
| AI        | Anthropic Claude (claude-sonnet)  |
| PDF Gen   | jsPDF 2.5 (CDN)                   |
| PDF Read  | PDF.js 3.11 (CDN)                 |
| Storage   | localStorage (no backend needed)  |

---

## 🏗️ Build for Production

```bash
npm run build
# Output goes to /dist folder
# Deploy to Vercel, Netlify, or any static host
```

---

## 🔧 Customization

**Add a subject:** Edit `SUBJECTS` in `src/utils/constants.js`

**Add sample topics:** Edit `SAMPLE_TOPICS` in `src/utils/constants.js`

**Change free limits:** Edit `FREE_GENERATIONS` and `FREE_PDF_UPLOADS` in `src/utils/constants.js`

**Change premium codes:** Edit `PREMIUM_CODES` array in `src/utils/constants.js`

**Change owner email:** Edit `OWNER_EMAIL` in `src/utils/constants.js`

---

Built with ❤️ for Indian CA students

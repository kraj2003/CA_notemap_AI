import { useState, useRef } from "react";
import { LOAD_MSGS, FREE_WORD_LIMIT } from "./utils/constants";
import {  callClaude } from "./utils/ai";
import { useUser } from "./hooks/useUser";
import { PayModal } from "./components/UI";
import HeroPage    from "./pages/HeroPage";
import SubjectPage from "./pages/SubjectPage";
import InputPage   from "./pages/InputPage";
import LoadingPage from "./pages/LoadingPage";
import ResultsPage from "./pages/ResultsPage";
import "./styles/global.css";

export default function App() {
  const [screen,   setScreen]  = useState("hero");
  const [subject,  setSubject] = useState(null);
  const [attempt,  setAttempt] = useState("Final");
  const [noteText, setNoteText] = useState("");
  const [results,  setResults] = useState(null);
  const [loadPct,  setLoadPct] = useState(0);
  const [loadMsg,  setLoadMsg] = useState("");
  const [error,    setError]   = useState("");
  const [showPay,  setShowPay] = useState(false);

  const user     = useUser();
  const timerRef = useRef(null);

  const handleEmailSubmit = (email) => {
    user.setEmail(email);
    setScreen("subject");
  };

  const handleSubjectSelect = (sub, att) => {
    setSubject(sub);
    setAttempt(att);
    setScreen("input");
  };

  const handleGenerate = async () => {
    if (noteText.trim().length < 40) { setError("Please enter at least 40 characters."); return; }
    if (!user.canGenerate()) { setShowPay(true); return; }
    setError("");
    setScreen("loading");
    setLoadPct(0);
    setLoadMsg(LOAD_MSGS[0]);

    let prog = 0;
    timerRef.current = setInterval(() => {
      prog = Math.min(prog + Math.random() * 10, 88);
      setLoadPct(prog);
      setLoadMsg(LOAD_MSGS[Math.min(Math.floor((prog / 100) * LOAD_MSGS.length), LOAD_MSGS.length - 1)]);
    }, 550);

    const isOwner   = user.isOwner();
    const isPremium = user.isPremium;
    const wordLimit = isOwner || isPremium ? 4000 : FREE_WORD_LIMIT;
    const notes     = noteText.trim().split(/\s+/).slice(0, wordLimit).join(" ");

    try {
      let data;
      try { data = await callClaude(subject, attempt, notes); }
      catch (e) { throw new Error("Generation failed: " + e.message); }

      clearInterval(timerRef.current);
      setLoadPct(100);
      setLoadMsg("Done! ✨");
      if (!isOwner && !isPremium) data._restricted = true;
      user.incrementGen();
      setTimeout(() => { setResults(data); setScreen("results"); }, 500);
    } catch (e) {
      clearInterval(timerRef.current);
      setError("Generation failed: " + e.message);
      setScreen("input");
    }
  };

  const handleUnlock = (code) => { const ok = user.unlockPremium(code); if (ok) setShowPay(false); return ok; };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="bg-grid" />
      <div className="bg-glow" />
      <div style={{ position: "relative", zIndex: 1 }}>
        {screen === "hero"    && <HeroPage onContinue={handleEmailSubmit} />}
        {screen === "subject" && <SubjectPage onSelect={handleSubjectSelect} onBack={() => setScreen("hero")} />}
        {screen === "input"   && (
          <InputPage
            subject={subject} attempt={attempt} user={user}
            noteText={noteText} setNoteText={setNoteText}
            onGenerate={handleGenerate}
            onChangeSubject={() => setScreen("subject")}
            onShowPayment={() => setShowPay(true)}
            error={error}
          />
        )}
        {screen === "loading" && <LoadingPage progress={loadPct} message={loadMsg} />}
        {screen === "results" && results && (
          <ResultsPage
            results={results} subject={subject} attempt={attempt} user={user}
            onBack={() => { setScreen("input"); setNoteText(""); setResults(null); }}
            onShowPayment={() => setShowPay(true)}
          />
        )}
      </div>
      {showPay && <PayModal onClose={() => setShowPay(false)} onUnlock={handleUnlock} />}
    </div>
  );
}


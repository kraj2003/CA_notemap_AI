import { useState, useRef, useEffect } from "react";
import { LOAD_MSGS, FREE_WORD_LIMIT } from "./utils/constants";
import { callClaude } from "./utils/ai";
import { useUser } from "./hooks/useUser";
import { PayModal } from "./components/UI";
import { track, EVENTS } from "./utils/analytics";
import HeroPage    from "./pages/HeroPage";
import SubjectPage from "./pages/SubjectPage";
import InputPage   from "./pages/InputPage";
import LoadingPage from "./pages/LoadingPage";
import ResultsPage from "./pages/ResultsPage";
import "./styles/global.css";

export default function App() {
  const [screen,     setScreen]     = useState("hero");
  const [subject,    setSubject]    = useState(null);
  const [attempt,    setAttempt]    = useState("Final");
  const [noteText,   setNoteText]   = useState("");
  const [results,    setResults]    = useState(null);
  const [loadPct,    setLoadPct]    = useState(0);
  const [loadMsg,    setLoadMsg]    = useState("");
  const [error,      setError]      = useState("");
  const [showPay,    setShowPay]    = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const user     = useUser();
  const timerRef = useRef(null);

  // ── Catch Razorpay payment return ───────────────────────────────────────
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const paymentId = params.get("payment_id");
    const urlEmail  = params.get("email");

    if (paymentId && urlEmail) {
      user.handlePaymentReturn(paymentId, urlEmail).then((success) => {
        if (success) {
          track(EVENTS.PREMIUM_ACTIVATED);
          user.setEmail(urlEmail);
          setPaySuccess(true);
          setScreen("subject");
          window.history.replaceState({}, "", window.location.pathname);
        }
      });
    }
  }, []);

  // ── Email submit ─────────────────────────────────────────────────────────
  const handleEmailSubmit = (email) => {
    user.setEmail(email);
    track(EVENTS.EMAIL_SUBMITTED);
    setScreen("subject");
  };

  // ── Subject select ───────────────────────────────────────────────────────
  const handleSubjectSelect = (sub, att) => {
    setSubject(sub);
    setAttempt(att);
    setScreen("input");
  };

  // ── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (noteText.trim().length < 40) {
      setError("Please enter at least 40 characters.");
      return;
    }

    // Paywall check
    if (!user.canGenerate()) {
      track(EVENTS.PAYWALL_SHOWN, { gens_used: user.freeGens });
      setShowPay(true);
      return;
    }

    setError("");
    setScreen("loading");
    setLoadPct(0);
    setLoadMsg(LOAD_MSGS[0]);

    let prog = 0;
    timerRef.current = setInterval(() => {
      prog = Math.min(prog + Math.random() * 10, 88);
      setLoadPct(prog);
      setLoadMsg(LOAD_MSGS[
        Math.min(Math.floor((prog / 100) * LOAD_MSGS.length), LOAD_MSGS.length - 1)
      ]);
    }, 550);

    const isOwner   = user.isOwner();
    const isPremium = user.isPremium;
    const wordLimit = isOwner || isPremium ? 4000 : FREE_WORD_LIMIT;
    const notes     = noteText.trim().split(/\s+/).slice(0, wordLimit).join(" ");

    try {
      const data = await callClaude(subject, attempt, notes);

      clearInterval(timerRef.current);
      setLoadPct(100);
      setLoadMsg("Done! ✨");

      if (!isOwner && !isPremium) data._restricted = true;

      user.incrementGen();
      track(EVENTS.GENERATION_COMPLETED, { subject, attempt });
      setTimeout(() => { setResults(data); setScreen("results"); }, 500);

    } catch (e) {
      clearInterval(timerRef.current);

      let msg = "Something went wrong. Please try again.";
      if (e.message.includes("waking up") || e.message.includes("30 seconds"))
        msg = "Server is starting up — please wait 30 seconds and try again.";
      else if (e.message.includes("fetch") || e.message.includes("reach"))
        msg = "Connection issue. Please check your internet and try again.";
      else if (e.message.includes("400"))
        msg = "Notes too short. Please add more content and try again.";
      else if (e.message.includes("500"))
        msg = "Server error. Please try again in a moment.";

      track(EVENTS.GENERATION_FAILED, { error: msg });
      setError(msg);
      setScreen("input");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="bg-grid" />
      <div className="bg-glow" />

      {paySuccess && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "linear-gradient(90deg, #3DB88A, #0EA5A0)",
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: "#080C10", fontWeight: 800, fontSize: 14 }}>
            🎉 Payment successful! Premium activated for {user.email}
          </span>
          <button
            onClick={() => setPaySuccess(false)}
            style={{ background: "none", border: "none", color: "#080C10", cursor: "pointer", fontSize: 20 }}
          >×</button>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, paddingTop: paySuccess ? 48 : 0 }}>
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

      {showPay && (
        <PayModal
          onClose={() => setShowPay(false)}
          email={user.email}
        />
      )}
    </div>
  );
}
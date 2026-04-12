import { useState, useEffect } from "react";
import { OWNER_EMAIL, FREE_GENERATIONS, FREE_PDF_UPLOADS } from "../utils/constants";

// ← Fixed: was "http://0.0.0.0:8000" which browsers can't reach
const BACKEND_URL = "https://ca-notemap-ai.onrender.com";

function getStorageKey(email) {
  return `ca_notemap_${email.toLowerCase().trim()}`;
}

function loadUserData(email) {
  try {
    const raw = localStorage.getItem(getStorageKey(email));
    return raw
      ? JSON.parse(raw)
      : { isPremium: false, freeGens: 0, freePdfs: 0 };
  } catch {
    return { isPremium: false, freeGens: 0, freePdfs: 0 };
  }
}

function saveUserData(email, data) {
  try {
    localStorage.setItem(getStorageKey(email), JSON.stringify(data));
  } catch {}
}

export function useUser() {
  const [email,     setEmailState] = useState("");
  const [isPremium, setIsPremium]  = useState(false);
  const [freeGens,  setFreeGens]   = useState(0);
  const [freePdfs,  setFreePdfs]   = useState(0);
  const [checking,  setChecking]   = useState(false);

  const setEmail = async (val) => {
    const cleaned = val.toLowerCase().trim();
    setEmailState(cleaned);

    if (cleaned === OWNER_EMAIL.toLowerCase()) {
      setIsPremium(true);
      setFreeGens(0);
      setFreePdfs(0);
      return;
    }

    const saved = loadUserData(cleaned);
    setIsPremium(saved.isPremium || false);
    setFreeGens(saved.freeGens   || 0);
    setFreePdfs(saved.freePdfs   || 0);

    try {
      setChecking(true);
      const res  = await fetch(`${BACKEND_URL}/api/check-premium`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: cleaned }),
      });
      const data = await res.json();
      if (data.is_premium) {
        setIsPremium(true);
        saveUserData(cleaned, { ...saved, isPremium: true });
      }
      if (data.free_gens_used > (saved.freeGens || 0)) {
        setFreeGens(data.free_gens_used);
        saveUserData(cleaned, { ...saved, freeGens: data.free_gens_used });
      }
    } catch {
      // Backend unreachable — localStorage is fallback, app still works
    } finally {
      setChecking(false);
    }
  };

  const handlePaymentReturn = async (paymentId, emailFromUrl) => {
    if (!paymentId || !emailFromUrl) return false;
    try {
      const res  = await fetch(`${BACKEND_URL}/api/verify-razorpay`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          razorpay_payment_id: paymentId,
          email: emailFromUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const saved = loadUserData(emailFromUrl);
        saveUserData(emailFromUrl, { ...saved, isPremium: true });
        setIsPremium(true);
        return true;
      }
    } catch {}
    return false;
  };

  useEffect(() => {
    if (email && email !== OWNER_EMAIL.toLowerCase()) {
      saveUserData(email, { isPremium, freeGens, freePdfs });
    }
  }, [email, isPremium, freeGens, freePdfs]);

  const isOwner = () => email === OWNER_EMAIL.toLowerCase();

  const canGenerate  = () => isOwner() || isPremium || freeGens < FREE_GENERATIONS;
  const canUploadPdf = () => isOwner() || isPremium || freePdfs < FREE_PDF_UPLOADS;

  const remainingGens = () => isOwner() || isPremium ? Infinity : Math.max(0, FREE_GENERATIONS - freeGens);
  const remainingPdfs = () => isOwner() || isPremium ? Infinity : Math.max(0, FREE_PDF_UPLOADS  - freePdfs);

  const incrementGen = () => {
    if (!isOwner() && !isPremium) {
      setFreeGens((g) => g + 1);
      fetch(`${BACKEND_URL}/api/increment-gen`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      }).catch(() => {});
    }
  };

  const incrementPdf = () => {
    if (!isOwner() && !isPremium) setFreePdfs((p) => p + 1);
  };

  const isTabLocked = (tabId) => {
    if (isOwner() || isPremium) return false;
    return ["flashcards", "quiz", "amendments", "plan"].includes(tabId);
  };

  return {
    email, setEmail, checking,
    isPremium, isOwner,
    freeGens, freePdfs,
    canGenerate, canUploadPdf,
    remainingGens, remainingPdfs,
    incrementGen, incrementPdf,
    isTabLocked,
    handlePaymentReturn,
  };
}
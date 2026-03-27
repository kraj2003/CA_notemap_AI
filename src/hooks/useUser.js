import { useState, useEffect } from "react";
import { OWNER_EMAIL, PREMIUM_CODES, FREE_GENERATIONS, FREE_PDF_UPLOADS } from "../utils/constants";

const STORAGE_KEY = "ca_notemap_user";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useUser() {
  const [email, setEmailState] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [freeGens, setFreeGens] = useState(0);
  const [freePdfs, setFreePdfs] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setEmailState(saved.email || "");
      setIsPremium(saved.isPremium || false);
      setFreeGens(saved.freeGens || 0);
      setFreePdfs(saved.freePdfs || 0);
    }
  }, []);

  // Persist whenever state changes
  useEffect(() => {
    if (email) {
      saveState({ email, isPremium, freeGens, freePdfs });
    }
  }, [email, isPremium, freeGens, freePdfs]);

  const setEmail = (val) => {
    setEmailState(val);
    // Owner gets unlimited access automatically
    if (val.toLowerCase().trim() === OWNER_EMAIL.toLowerCase()) {
      setIsPremium(true);
    }
  };

  const isOwner = () =>
    email.toLowerCase().trim() === OWNER_EMAIL.toLowerCase();

  const canGenerate = () => {
    if (isOwner() || isPremium) return true;
    return freeGens < FREE_GENERATIONS;
  };

  const canUploadPdf = () => {
    if (isOwner() || isPremium) return true;
    return freePdfs < FREE_PDF_UPLOADS;
  };

  const remainingGens = () => {
    if (isOwner() || isPremium) return Infinity;
    return Math.max(0, FREE_GENERATIONS - freeGens);
  };

  const remainingPdfs = () => {
    if (isOwner() || isPremium) return Infinity;
    return Math.max(0, FREE_PDF_UPLOADS - freePdfs);
  };

  const incrementGen = () => {
    if (!isOwner() && !isPremium) setFreeGens((g) => g + 1);
  };

  const incrementPdf = () => {
    if (!isOwner() && !isPremium) setFreePdfs((p) => p + 1);
  };

  const unlockPremium = (code) => {
    if (PREMIUM_CODES.includes(code.toUpperCase())) {
      setIsPremium(true);
      return true;
    }
    return false;
  };

  const isTabLocked = (tabId) => {
    if (isOwner() || isPremium) return false;
    const lockedTabs = ["flashcards", "quiz", "amendments", "plan"];
    return lockedTabs.includes(tabId);
  };

  return {
    email, setEmail,
    isPremium, isOwner,
    freeGens, freePdfs,
    canGenerate, canUploadPdf,
    remainingGens, remainingPdfs,
    incrementGen, incrementPdf,
    unlockPremium, isTabLocked,
  };
}

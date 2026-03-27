/**
 * CA NoteMap AI — API utility
 * Points to deployed Render backend
 */

// ← Paste your Render URL here
const BACKEND_URL = "https://ca-notemap-ai.onrender.com";

export async function callClaude(subject, attempt, notes) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(`${BACKEND_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, attempt, notes }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Backend error ${res.status}: ${err}`);
    }

    return await res.json();

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Server is waking up. Wait 30 seconds and try again.");
    }
    if (err.message.includes("Failed to fetch")) {
      throw new Error("Cannot reach server. Try again in 30 seconds.");
    }
    throw err;
  }
}
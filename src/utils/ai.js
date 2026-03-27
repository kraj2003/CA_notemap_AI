/**
 * Call the local FastAPI backend
 */
export async function callClaude(subject, attempt, notes) {
  const res = await fetch("http://localhost:8000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, attempt, notes }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backend error ${res.status}: ${err}`);
  }
  return await res.json();
}
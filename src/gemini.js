// The only file that talks to Gemini. Swap providers by replacing this file.
import { MODEL, API_BASE, MAX_JOB_CHARS, MAX_PROFILE_CHARS, TIMEOUT_MS } from "./config.js";
import { buildPrompt, clip, parseModelJson } from "./core.js";

export async function analyzeWithGemini(jobText, profile, apiKey, fetchFn = fetch) {
  const prompt = buildPrompt(clip(jobText, MAX_JOB_CHARS), clip(profile, MAX_PROFILE_CHARS));
  try {
    // Key goes in a header, not the URL, so it does not end up in logs or history.
    const res = await fetchFn(`${API_BASE}/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
      // The signal also covers reading the reply body below.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      // Status only. The response body is not echoed, to avoid leaking anything odd.
      throw new Error(`Gemini request failed (HTTP ${res.status})`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new Error("Gemini returned no text (blocked or empty reply)");
    return parseModelJson(text);
  } catch (e) {
    if (e?.name === "TimeoutError") {
      throw new Error(`Gemini did not answer within ${TIMEOUT_MS / 1000} seconds. Try again.`);
    }
    throw e;
  }
}

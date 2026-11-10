import test from "node:test";
import assert from "node:assert/strict";
import { clip, findSkills, mockAnalyze, parseModelJson, buildPrompt } from "../src/core.js";
import { analyzeWithGemini } from "../src/gemini.js";

test("findSkills matches whole words only", () => {
  assert.deepEqual(findSkills("Our career in javascript"), ["javascript"]);
  assert.deepEqual(findSkills("Python, SQL and C++."), ["python", "sql", "c++"]);
});

test("mockAnalyze scores matched share and lists gaps", () => {
  const r = mockAnalyze("Need Python, SQL, Docker, AWS", "I know python and sql");
  assert.equal(r.score, 5);
  assert.deepEqual(r.matched, ["python", "sql"]);
  assert.deepEqual(r.gaps, ["docker", "aws"]);
  assert.equal(r.mock, true);
});

test("mockAnalyze returns 0 when job has no known skills", () => {
  assert.equal(mockAnalyze("Great culture, free lunch", "python").score, 0);
});

test("parseModelJson accepts fenced JSON and clamps score", () => {
  const r = parseModelJson('```json\n{"score": 14, "matched": ["a"], "gaps": [], "summary": "ok"}\n```');
  assert.equal(r.score, 10);
  assert.deepEqual(r.matched, ["a"]);
});

test("parseModelJson rejects bad replies", () => {
  assert.throws(() => parseModelJson("no json here"), /no JSON/);
  assert.throws(() => parseModelJson("{bad json}"), /not valid JSON/);
  assert.throws(() => parseModelJson('{"matched": []}'), /numeric score/);
});

test("clip collapses whitespace and cuts length", () => {
  assert.equal(clip("a   b\n\nc", 100), "a b c");
  assert.equal(clip("abcdef", 3), "abc");
});

test("buildPrompt keeps job text after the untrusted-data warning", () => {
  const p = buildPrompt("JOB", "PROFILE");
  assert.ok(p.indexOf("untrusted") < p.indexOf("JOB"));
});

test("analyzeWithGemini sends key in header, not URL, and parses reply", async () => {
  let seen;
  const fake = async (url, opts) => {
    seen = { url, opts };
    return {
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"score":7,"matched":["x"],"gaps":["y"],"summary":"s"}' }] } }] }),
    };
  };
  const r = await analyzeWithGemini("job", "me", "TESTKEY", fake);
  assert.equal(r.score, 7);
  assert.ok(!seen.url.includes("TESTKEY"));
  assert.equal(seen.opts.headers["x-goog-api-key"], "TESTKEY");
});

test("analyzeWithGemini error message has status but no key", async () => {
  const fake = async () => ({ ok: false, status: 403 });
  await assert.rejects(() => analyzeWithGemini("j", "p", "TESTKEY", fake), (e) => /403/.test(e.message) && !e.message.includes("TESTKEY"));
});

// Service worker: shortcut -> read page text -> analyse -> show panel on the page.
import { mockAnalyze } from "./core.js";
import { analyzeWithGemini } from "./gemini.js";
import { MAX_JOB_CHARS } from "./config.js";

// Runs INSIDE the page. Must be self-contained (no imports, no outer variables).
function readPageText(max) {
  return document.body.innerText.slice(0, max * 2);
}

// Runs INSIDE the page. Draws the result with textContent only, never innerHTML,
// so text from the job page or the model cannot inject markup.
function showPanel(state) {
  document.getElementById("jfc-host")?.remove();
  const host = document.createElement("div");
  host.id = "jfc-host";
  host.style.cssText = "position:fixed;top:12px;right:12px;z-index:2147483647;";
  const root = host.attachShadow({ mode: "closed" });
  const el = (tag, text, css) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (css) e.style.cssText = css;
    return e;
  };
  const box = el("div", undefined,
    "all:initial;display:block;box-sizing:border-box;width:320px;max-height:80vh;overflow:auto;" +
    "background:#fff;color:#111;border:1px solid #888;border-radius:8px;padding:12px;" +
    "font:14px/1.4 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3)");
  const close = el("button", "Close", "float:right;font:inherit;cursor:pointer");
  close.onclick = () => host.remove();
  box.append(close, el("b", "Job Fit Checker"));
  if (state.status === "loading") {
    box.append(el("p", "Analysing this page..."));
  } else if (state.status === "error") {
    box.append(el("p", "Error: " + state.message, "color:#b00020"));
  } else {
    const r = state.result;
    if (r.mock) box.append(el("p", "MOCK MODE: no API key set, keyword match only.", "background:#fff3cd;padding:4px"));
    box.append(el("p", r.score + " / 10", "font-size:28px;font-weight:bold;margin:8px 0"));
    box.append(el("p", r.summary));
    for (const [title, list] of [["Matched skills", r.matched], ["Gaps", r.gaps]]) {
      box.append(el("div", title, "font-weight:bold;margin-top:8px"));
      const ul = el("ul", undefined, "margin:4px 0;padding-left:20px");
      for (const s of list.length ? list : ["none"]) ul.append(el("li", s));
      box.append(ul);
    }
  }
  root.append(box);
  document.documentElement.append(host);
}

async function inject(tabId, func, args) {
  const [res] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return res?.result;
}

async function run(tab) {
  try {
    await inject(tab.id, showPanel, [{ status: "loading" }]);
    const jobText = await inject(tab.id, readPageText, [MAX_JOB_CHARS]);
    if (!jobText || jobText.trim().length < 50) throw new Error("This page has almost no visible text.");
    const { apiKey, profile } = await chrome.storage.local.get(["apiKey", "profile"]);
    if (!profile || !profile.trim()) throw new Error("Open the extension options and save your profile first.");
    const result = apiKey
      ? await analyzeWithGemini(jobText, profile, apiKey)
      : mockAnalyze(jobText, profile);
    await inject(tab.id, showPanel, [{ status: "done", result }]);
    chrome.action.setBadgeText({ tabId: tab.id, text: "" });
  } catch (e) {
    console.error("Job Fit Checker:", e.message);
    // Pages like chrome:// block injection, so the panel itself may be impossible. Badge is the fallback.
    chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    try {
      await inject(tab.id, showPanel, [{ status: "error", message: e.message }]);
    } catch (e2) {
      console.error("Job Fit Checker: could not show the error panel:", e2.message);
    }
  }
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd === "check-fit") run(await activeTab());
});
chrome.action.onClicked.addListener((tab) => run(tab));

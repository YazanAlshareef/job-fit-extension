# Walkthrough: every file in plain English

**manifest.json** - The extension's ID card. Says it is Manifest V3, lists the three permissions, names the background script, the options page, the toolbar icon, and the Alt+Shift+F shortcut (called `check-fit`).

**src/background.js** - The service worker; the "controller". When the shortcut or icon fires, `run()` does this in order: show "Analysing..." on the page, read the page text, load the profile and key from storage, pick mock mode (no key) or Gemini (key), show the result. `readPageText` and `showPanel` are injected into the web page, so they cannot use imports. `showPanel` builds the panel with `textContent` only (never `innerHTML`) so no page or model text can run as code. Errors go to the panel and to a "!" badge.

**src/gemini.js** - The adapter. The only file that knows about Gemini: builds the request, sends it with the key in a header, checks the status, pulls the text out of the reply, and hands it to the parser. To use another provider, rewrite this file only.

**src/core.js** - Pure logic with no browser or network, so tests can run it in Node. `clip` trims text. `findSkills` finds whole-word skills. `mockAnalyze` is the no-key scoring (matched share of job skills x 10). `buildPrompt` writes the instructions. `parseModelJson` cleans the model reply (code fences, extra text), checks it and clamps the score to 0-10.

**src/config.js** - Settings: model name, API address, text length limits.

**options.html / options.js** - The settings page. A password-type box for the key, a box for the profile, and a Save button writing to `chrome.storage.local`.

**sample/sample-job.html** - A synthetic (made-up) job page for testing. It includes hidden text to prove hidden text is not read.

**test/core.test.js** - Unit tests (Node's built-in runner): skill matching, mock scoring, JSON parsing, clipping, and the Gemini adapter with a fake `fetch` (checks the key is in the header and not in errors).

**scripts/zip.js** - Builds `dist/job-fit-extension.zip` with only the files Chrome needs.

**package.json** - Defines `npm test` and `npm run zip`. No dependencies.

**.gitignore** - Keeps `dist/`, zips, `.env` files and node_modules out of git.

**LICENSE** - MIT.

**README.md** - What it is, how to run, permissions, privacy, limits.

# Job Fit Checker

A small Chrome extension. On a job page, press **Alt+Shift+F**. It reads the visible text, sends it with your saved profile to Google Gemini, and shows a fit score (0-10), matched skills and gaps in a panel on the page.

## How an AI coding assistant helped

I used an AI coding assistant to draft the code, the tests and the docs, and to look up the current Gemini and Chrome Manifest V3 docs. I reviewed each file and can explain it (see WALKTHROUGH.md). The design choices (one adapter file, mock mode, minimal permissions, no remote code) were set in the brief I gave it.

## What broke and how it was fixed

- `node --test test/` failed with MODULE_NOT_FOUND on Node 24. Fixed by passing a glob: `test/*.test.js`.
- First shortcut test showed nothing. Cause: my OS-level key press went to a different window that had focus. Fixed by sending the key event to the test tab through the Chrome DevTools Protocol instead.
- `sample-job.html` opened as a `file://` page would need the "Allow access to file URLs" switch. I served it from `http://localhost` for testing instead.
- The brief asked for only `activeTab` and `storage`. Chrome needs a third one, `scripting`, to read page text (see Permissions).

## How to run

1. `npm test` runs the unit tests (Node 20+, no dependencies to install).
2. Open `chrome://extensions`, turn on Developer mode, click **Load unpacked**, pick this folder.
3. Open the extension's **Options**. Paste your profile. Optionally paste a Gemini API key from Google AI Studio. With no key the extension runs in **mock mode** (keyword match, no network).
4. Open `sample/sample-job.html` (synthetic, made up) or a real job page and press **Alt+Shift+F**. You can also click the toolbar icon. Change the shortcut at `chrome://extensions/shortcuts`.
5. `npm run zip` builds `dist/job-fit-extension.zip` (not committed).

The model name lives in `src/config.js` (`MODEL`). The default `gemini-3.5-flash-lite` is **unverified**: it comes from the docs, but I never called it with a real key. If you get an HTTP 404, pick a current model from Google's model list and change it there. Google also retires names over time.

## Permissions (each one is used)

| Permission | Why |
|---|---|
| `activeTab` | Gives temporary access to the current tab only after you press the shortcut or click the icon. No access to other tabs, no always-on access. |
| `storage` | Saves your API key and profile in `chrome.storage.local` on your machine. |
| `scripting` | Needed to call `chrome.scripting.executeScript`, which reads the page text and draws the result panel. It gives no site access by itself and shows no install warning. This and `host_permissions` go beyond the two permissions in the brief. |
| `host_permissions`: `https://generativelanguage.googleapis.com/*` | Lets the service worker call the Gemini API. This is the only site the extension can contact. It is not access to the pages you browse. **Untested with a live key**: I added it so the call does not depend on the API's CORS settings, but I have not run a real request. |

## Privacy

- Your API key and profile stay in `chrome.storage.local` in your browser. They are not bundled in the code and not committed.
- Nothing is sent anywhere until you press the shortcut. In mock mode nothing leaves your browser.
- With a key set, the page text (first 12,000 characters) and your profile (first 6,000) are sent to Google's Gemini API. Google's terms apply to that data. Do not put anything in the profile you do not want sent.
- No analytics, no other servers, no remote code. All JavaScript is in this package.
- The key is sent in a request header, not in the URL, and error messages never include it.

## Limits

- The real Gemini call was **not tested with a real key**. The request format follows the current Gemini docs, and the code is unit-tested against a fake `fetch`. A bad key was tried and returned HTTP 400, which the panel showed correctly.
- The score is a model opinion on text. The job page text is untrusted: a page could try to trick the model. The prompt tells the model to ignore instructions in it, and results are drawn as plain text, but the score can still be wrong.
- Mock mode knows about 34 skills only.
- Only visible text of the top page is read (not iframes). Long pages are cut.
- `file://` pages need "Allow access to file URLs" turned on for the extension.
- Not checked: Edge/Brave/Firefox, macOS shortcut, the Chrome Web Store (not published, on purpose).
- The test sample page and company are fictional.

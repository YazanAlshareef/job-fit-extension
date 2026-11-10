// Settings in one place. Change MODEL here when Google retires a model name.
// UNVERIFIED: this name came from the docs but has never been called with a real key.
// If the panel shows an HTTP 404 error, check the current model list and change it here.
export const MODEL = "gemini-3.5-flash-lite";
export const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Job pages can be huge. Cut the text so the request stays small and cheap.
// Stop waiting for Gemini after this long.
export const TIMEOUT_MS = 30000;
export const MAX_JOB_CHARS = 12000;
export const MAX_PROFILE_CHARS = 6000;

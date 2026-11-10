// Settings in one place. Change MODEL here when Google retires a model name.
export const MODEL = "gemini-3.5-flash-lite";
export const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Job pages can be huge. Cut the text so the request stays small and cheap.
export const MAX_JOB_CHARS = 12000;
export const MAX_PROFILE_CHARS = 6000;

import type {
  AnswerResponse,
  CreateDebriefInput,
  CreatedDebrief,
  DebriefDetail,
  DebriefSummary,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Typed endpoint functions (see CONTRACT.md) ---

/** GET /api/debriefs — list all debriefs (newest first, per backend). */
export function listDebriefs(): Promise<DebriefSummary[]> {
  return apiFetch<DebriefSummary[]>("/api/debriefs");
}

/** GET /api/debriefs/{id} — full record including turns + summary. */
export function getDebrief(id: string): Promise<DebriefDetail> {
  return apiFetch<DebriefDetail>(`/api/debriefs/${id}`);
}

/** POST /api/debriefs — open a new debrief, returns first question. */
export function createDebrief(input: CreateDebriefInput): Promise<CreatedDebrief> {
  return apiFetch<CreatedDebrief>("/api/debriefs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** POST /api/debriefs/{id}/answer — submit an answer, get next step. */
export function submitAnswer(id: string, answerText: string): Promise<AnswerResponse> {
  return apiFetch<AnswerResponse>(`/api/debriefs/${id}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer_text: answerText }),
  });
}

/** POST /api/debriefs/{id}/complete — finalize and return markdown report. */
export function completeDebrief(id: string): Promise<{ summary_markdown: string }> {
  return apiFetch<{ summary_markdown: string }>(`/api/debriefs/${id}/complete`, {
    method: "POST",
  });
}

/** Normalize any thrown value to a display string. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

// Domain types mirrored from CONTRACT.md — the authoritative API spec.

export type DebriefStatus = "in_progress" | "complete" | string;

export interface CurrentQuestion {
  topic: string;
  question_text: string;
}

export interface Progress {
  current: number;
  total: number;
}

/** Returned by POST /api/debriefs */
export interface CreatedDebrief {
  id: string;
  current_question: CurrentQuestion;
  progress: Progress;
}

/** A single Q&A turn (GET /api/debriefs/{id}) */
export interface Turn {
  id: string;
  topic: string;
  question_text: string;
  answer_text: string;
  is_followup: boolean;
  order_index: number;
}

/** Row shape from GET /api/debriefs */
export interface DebriefSummary {
  id: string;
  operator_name: string;
  mission_name: string;
  mission_date: string;
  status: DebriefStatus;
  created_at: string;
}

/** Full record from GET /api/debriefs/{id} */
export interface DebriefDetail {
  id: string;
  operator_name: string;
  mission_name: string;
  mission_date: string;
  status: DebriefStatus;
  turns: Turn[];
  summary: string | null;
}

export type AnswerOutcome = "followup" | "next_topic" | "complete";

/** Returned by POST /api/debriefs/{id}/answer */
export interface AnswerResponse {
  next: {
    type: AnswerOutcome;
    topic: string;
    question_text: string;
    progress: Progress;
  };
}

/** Payload to create a debrief */
export interface CreateDebriefInput {
  operator_name: string;
  mission_name: string;
  mission_date: string;
}

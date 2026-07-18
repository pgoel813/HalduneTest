import type { CurrentQuestion } from "../types";

/**
 * Fixed doctrinal question bank (CONTRACT.md). Order matters.
 * Used to render human-readable topic labels and to reconstruct the
 * current primary question when in-memory state is lost (e.g. page refresh).
 */
export const QUESTION_BANK: ReadonlyArray<{ topic: string; label: string; question: string }> = [
  {
    topic: "mission_overview",
    label: "MISSION OVERVIEW",
    question: "State your mission, objective, and assigned tasks for this operation.",
  },
  {
    topic: "execution_timeline",
    label: "EXECUTION TIMELINE",
    question: "Walk through the sequence of events from mission start to completion.",
  },
  {
    topic: "enemy_contact",
    label: "ENEMY CONTACT",
    question: "Describe any enemy contact, threats encountered, and actions taken.",
  },
  {
    topic: "communications",
    label: "COMMUNICATIONS",
    question: "Were communications maintained throughout? Note any failures or gaps.",
  },
  {
    topic: "equipment_logistics",
    label: "EQUIPMENT & LOGISTICS",
    question: "Report equipment status, malfunctions, and logistics issues.",
  },
  {
    topic: "coordination_command",
    label: "COORDINATION & COMMAND",
    question:
      "Describe coordination with higher command, adjacent units, or supporting elements.",
  },
  {
    topic: "plan_deviations",
    label: "PLAN DEVIATIONS",
    question: "What deviated from the original plan, and why?",
  },
  {
    topic: "lessons_learned",
    label: "LESSONS LEARNED",
    question: "What should be sustained, and what should be improved for future missions?",
  },
];

export const TOTAL_TOPICS = QUESTION_BANK.length;

/** 1-based ordinal for a topic key, or 0 if unknown. */
export function topicIndex(topic: string): number {
  const i = QUESTION_BANK.findIndex((q) => q.topic === topic);
  return i === -1 ? 0 : i + 1;
}

/** Human-readable label for a topic key. */
export function topicLabel(topic: string): string {
  const found = QUESTION_BANK.find((q) => q.topic === topic);
  return found ? found.label : topic.replace(/_/g, " ").toUpperCase();
}

/**
 * Best-effort reconstruction of the current primary question from answered turns.
 * Self-corrects after the next answer, whose API response is authoritative.
 */
export function reconstructCurrent(
  answeredTopics: ReadonlySet<string>,
): { current: CurrentQuestion; progressCurrent: number } {
  const idx = Math.min(answeredTopics.size, TOTAL_TOPICS - 1);
  const entry = QUESTION_BANK[idx];
  return {
    current: { topic: entry.topic, question_text: entry.question },
    progressCurrent: idx + 1,
  };
}

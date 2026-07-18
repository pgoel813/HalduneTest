import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { errorMessage, getDebrief, submitAnswer } from "../lib/api";
import { formatDate } from "../lib/format";
import {
  reconstructCurrent,
  topicIndex,
  topicLabel,
  TOTAL_TOPICS,
} from "../lib/questionBank";
import type { CurrentQuestion, DebriefDetail, Turn } from "../types";
import { StepIndicator } from "../components/StepIndicator";
import { Transcript } from "../components/Transcript";
import { ErrorNotice, InlineSpinner, Loading } from "../components/States";
import { useDocumentTitle } from "../lib/useDocumentTitle";

interface DerivedQuestion {
  current: CurrentQuestion;
  progressCurrent: number;
  isFollowup: boolean;
}

// --- sessionStorage: same-session UI convenience ONLY ---------------------
// It caches the operator's in-progress typed answer so a refresh mid-typing
// doesn't lose it. It is NEVER used to decide which topic/question is current
// — that is always derived from the backend's turns array (source of truth).

function draftKey(id: string): string {
  return `debrief:${id}:draft`;
}

function loadDraft(id: string): string {
  try {
    return sessionStorage.getItem(draftKey(id)) ?? "";
  } catch {
    return "";
  }
}

function saveDraft(id: string, text: string): void {
  try {
    if (text) sessionStorage.setItem(draftKey(id), text);
    else sessionStorage.removeItem(draftKey(id));
  } catch {
    /* non-fatal */
  }
}

function clearDraft(id: string): void {
  try {
    sessionStorage.removeItem(draftKey(id));
  } catch {
    /* non-fatal */
  }
}

// Removes any entry from the legacy scheme that cached the current question.
// Trusting that cache over the turns array was the bug (stale state leaking
// into a reused debrief id after a DB reset).
function clearLegacyState(id: string): void {
  try {
    sessionStorage.removeItem(`debrief:${id}:state`);
  } catch {
    /* non-fatal */
  }
}

function hasAnswer(turn: Turn): boolean {
  return turn.answer_text != null && turn.answer_text.trim() !== "";
}

/**
 * Derive the current pending question from the backend's turns array — the
 * single source of truth. Empty turns => topic 1. A trailing turn with no
 * answer_text is the current pending question (its topic/text/is_followup are
 * authoritative). Otherwise (all answered, not yet complete) fall back to the
 * next primary question.
 */
function deriveCurrentFromTurns(turns: Turn[]): DerivedQuestion {
  const pending = turns.find((t) => !hasAnswer(t));
  if (pending) {
    return {
      current: { topic: pending.topic, question_text: pending.question_text },
      progressCurrent: topicIndex(pending.topic) || 1,
      isFollowup: pending.is_followup,
    };
  }
  // No pending turn: empty turns resolve to topic 1; all-answered resolves to
  // the next primary. reconstructCurrent handles both via the answered set.
  const answeredTopics = new Set(turns.map((t) => t.topic));
  const { current, progressCurrent } = reconstructCurrent(answeredTopics);
  return { current, progressCurrent, isFollowup: false };
}

export function Interview() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DebriefDetail | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [current, setCurrent] = useState<CurrentQuestion | null>(null);
  const [progressCurrent, setProgressCurrent] = useState(1);
  const [isFollowup, setIsFollowup] = useState(false);

  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inFlightRef = useRef(false);

  useDocumentTitle(detail?.mission_name ?? null);

  // Initial load: the backend's turns array is the SOLE source of truth for
  // the current question. sessionStorage is never consulted to decide it.
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoadError(null);
    getDebrief(id)
      .then((data) => {
        if (!active) return;
        if (data.status === "complete" || data.status === "completed") {
          // Completed: clear any per-id sessionStorage so it can't leak into a
          // future reused id, then hand off to the summary view.
          clearDraft(id);
          clearLegacyState(id);
          navigate(`/debrief/${id}/summary`, { replace: true });
          return;
        }
        // Drop any stale cache from a previous (possibly reused) id up front.
        clearLegacyState(id);

        setDetail(data);
        const allTurns = data.turns ?? [];
        // Transcript shows only completed Q&A; the trailing pending turn (if
        // any) is the current question, not a transcript entry.
        setTurns(allTurns.filter(hasAnswer));

        const derived = deriveCurrentFromTurns(allTurns);
        setCurrent(derived.current);
        setProgressCurrent(derived.progressCurrent);
        setIsFollowup(derived.isFollowup);

        // Restore only the in-progress typed answer (a same-session UI aid).
        setAnswer(loadDraft(id));
      })
      .catch((err: unknown) => {
        if (active) setLoadError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const handleSubmit = useCallback(async () => {
    // Ref guard blocks re-entry even before the disabled button re-renders,
    // preventing any double POST (e.g. rapid Cmd+Enter + click).
    if (!current || inFlightRef.current) return;
    const trimmed = answer.trim();
    if (trimmed === "") return;

    inFlightRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    const answeredTurn: Turn = {
      id: `local-${turns.length}`,
      topic: current.topic,
      question_text: current.question_text,
      answer_text: trimmed,
      is_followup: isFollowup,
      order_index: turns.length,
    };

    try {
      const res = await submitAnswer(id, trimmed);
      // Commit the just-answered turn to the running transcript, and drop the
      // now-submitted draft.
      setTurns((prev) => [...prev, answeredTurn]);
      setAnswer("");
      clearDraft(id);

      const next = res.next;
      if (next.type === "complete") {
        clearDraft(id);
        clearLegacyState(id);
        navigate(`/debrief/${id}/summary`);
        return;
      }

      // The API response is authoritative for the immediately-next question;
      // hold it in React state only — never cache it as the "current" question.
      setCurrent({ topic: next.topic, question_text: next.question_text });
      setProgressCurrent(next.progress?.current ?? progressCurrent);
      setIsFollowup(next.type === "followup");
      textareaRef.current?.focus();
    } catch (err: unknown) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
      inFlightRef.current = false;
    }
  }, [answer, current, id, isFollowup, navigate, progressCurrent, turns.length]);

  function onAnswerChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setAnswer(value);
    saveDraft(id, value);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Only Cmd/Ctrl+Enter submits. Plain Enter is left to the textarea's
    // default behavior (insert a newline) — we do not preventDefault it.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <ErrorNotice message={loadError} />
        <div className="mt-4">
          <Link to="/" className="btn btn-ghost no-underline">
            ← Mission Log
          </Link>
        </div>
      </div>
    );
  }

  if (!detail || !current) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <Loading message="OPENING DEBRIEF" />
      </div>
    );
  }

  const topicNum = topicIndex(current.topic) || progressCurrent;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      {/* Mission header strip */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-5">
        <Link
          to="/"
          className="label-mono no-underline shrink-0"
          style={{ color: "var(--color-ink-faint)" }}
          aria-label="Back to mission log"
        >
          ← LOG
        </Link>
        <div
          aria-hidden
          className="shrink-0"
          style={{ height: 20, width: 1, backgroundColor: "var(--color-line)" }}
        />
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 min-w-0">
          <span
            style={{ color: "var(--color-ink)", fontWeight: 600, fontSize: 15 }}
          >
            {detail.mission_name}
          </span>
          <span
            style={{
              color: "var(--color-ink-faint)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          >
            {detail.operator_name} · {formatDate(detail.mission_date)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Primary column: question + answer */}
        <section className="flex flex-col gap-5" aria-label="Current question and response">
          <StepIndicator current={progressCurrent} total={TOTAL_TOPICS} />

          <div className="panel p-6" role="group" aria-live="polite" aria-atomic="true">
            <div className="flex items-center gap-3 mb-4">
              <span className="label-mono" style={{ color: "var(--color-amber)" }}>
                TOPIC {Math.min(topicNum, TOTAL_TOPICS)}/{TOTAL_TOPICS}
              </span>
              <span
                className="label-mono"
                style={{ color: "var(--color-ink-dim)", letterSpacing: "0.16em" }}
              >
                {topicLabel(current.topic)}
              </span>
            </div>

            {isFollowup && (
              <div
                className="flex items-start gap-3 mb-4 p-3"
                style={{
                  borderLeft: "3px solid var(--color-steel)",
                  backgroundColor: "color-mix(in srgb, var(--color-steel) 8%, transparent)",
                }}
              >
                <span
                  className="label-mono shrink-0"
                  style={{ color: "var(--color-steel-bright)", marginTop: 2 }}
                >
                  FOLLOW-UP
                </span>
                <span style={{ color: "var(--color-ink-faint)", fontSize: 13 }}>
                  Clarification required — prior response was insufficient.
                </span>
              </div>
            )}

            <p
              style={{
                fontSize: 22,
                lineHeight: 1.4,
                color: "var(--color-ink)",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {current.question_text}
            </p>
          </div>

          <div className="flex flex-col gap-3" role="group" aria-label="Operator response">
            <div className="flex items-center justify-between">
              <label htmlFor="operator-response" className="label-mono">
                OPERATOR RESPONSE
              </label>
              <span className="label-mono" aria-hidden>
                {answer.trim().length} CHARS
              </span>
            </div>
            <textarea
              id="operator-response"
              ref={textareaRef}
              className="field"
              value={answer}
              onChange={onAnswerChange}
              onKeyDown={onKeyDown}
              placeholder="Provide a specific, complete account. Address who / what / when / where / why as relevant."
              rows={9}
              autoFocus
              disabled={submitting}
              aria-label="Operator response to the current question"
              aria-describedby="response-submit-hint"
              aria-busy={submitting}
              style={{ resize: "vertical", lineHeight: 1.55 }}
            />

            {submitError && <ErrorNotice message={submitError} />}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span
                id="response-submit-hint"
                className="label-mono"
                style={{ color: "var(--color-ink-faint)" }}
              >
                CMD/CTRL + ENTER TO SUBMIT
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleSubmit()}
                disabled={submitting || answer.trim() === ""}
                aria-label="Submit response"
                aria-busy={submitting}
              >
                {submitting && <InlineSpinner />}
                {submitting ? "Transmitting…" : "Submit Response"}
              </button>
            </div>
          </div>
        </section>

        {/* Transcript sidebar */}
        <Transcript turns={turns} />
      </div>
    </div>
  );
}

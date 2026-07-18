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
import { ErrorNotice, Loading } from "../components/States";

interface PersistedState {
  current: CurrentQuestion;
  progressCurrent: number;
  isFollowup: boolean;
}

function stateKey(id: string): string {
  return `debrief:${id}:state`;
}

function loadPersisted(id: string): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(stateKey(id));
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function persist(id: string, state: PersistedState): void {
  try {
    sessionStorage.setItem(stateKey(id), JSON.stringify(state));
  } catch {
    /* non-fatal: refresh recovery degrades to reconstruction */
  }
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

  // Initial load: hydrate transcript + resolve the pending question.
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoadError(null);
    getDebrief(id)
      .then((data) => {
        if (!active) return;
        if (data.status === "complete" || data.status === "completed") {
          navigate(`/debrief/${id}/summary`, { replace: true });
          return;
        }
        setDetail(data);
        setTurns(data.turns ?? []);

        const persisted = loadPersisted(id);
        if (persisted) {
          setCurrent(persisted.current);
          setProgressCurrent(persisted.progressCurrent);
          setIsFollowup(persisted.isFollowup);
        } else {
          const answeredTopics = new Set((data.turns ?? []).map((t) => t.topic));
          const { current: c, progressCurrent: pc } = reconstructCurrent(answeredTopics);
          setCurrent(c);
          setProgressCurrent(pc);
          setIsFollowup(false);
        }
      })
      .catch((err: unknown) => {
        if (active) setLoadError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!current || submitting) return;
    const trimmed = answer.trim();
    if (trimmed === "") return;

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
      // Commit the just-answered turn to the running transcript.
      setTurns((prev) => [...prev, answeredTurn]);
      setAnswer("");

      const next = res.next;
      if (next.type === "complete") {
        sessionStorage.removeItem(stateKey(id));
        navigate(`/debrief/${id}/summary`);
        return;
      }

      const nextState: PersistedState = {
        current: { topic: next.topic, question_text: next.question_text },
        progressCurrent: next.progress?.current ?? progressCurrent,
        isFollowup: next.type === "followup",
      };
      setCurrent(nextState.current);
      setProgressCurrent(nextState.progressCurrent);
      setIsFollowup(nextState.isFollowup);
      persist(id, nextState);
      textareaRef.current?.focus();
    } catch (err: unknown) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [answer, current, id, isFollowup, navigate, progressCurrent, submitting, turns.length]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="label-mono no-underline"
            style={{ color: "var(--color-ink-faint)" }}
          >
            ← LOG
          </Link>
          <div style={{ height: 20, width: 1, backgroundColor: "var(--color-line)" }} />
          <div>
            <span
              style={{ color: "var(--color-ink)", fontWeight: 600, fontSize: 15 }}
            >
              {detail.mission_name}
            </span>
            <span
              className="ml-3"
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Primary column: question + answer */}
        <section className="flex flex-col gap-5">
          <StepIndicator current={progressCurrent} total={TOTAL_TOPICS} />

          <div className="panel p-6">
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="label-mono">OPERATOR RESPONSE</span>
              <span className="label-mono">{answer.trim().length} CHARS</span>
            </div>
            <textarea
              ref={textareaRef}
              className="field"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Provide a specific, complete account. Address who / what / when / where / why as relevant."
              rows={9}
              autoFocus
              disabled={submitting}
              style={{ resize: "vertical", lineHeight: 1.55 }}
            />

            {submitError && <ErrorNotice message={submitError} />}

            <div className="flex items-center justify-between">
              <span
                className="label-mono"
                style={{ color: "var(--color-ink-faint)" }}
              >
                CMD/CTRL + ENTER TO SUBMIT
              </span>
              <button
                className="btn btn-primary"
                onClick={() => void handleSubmit()}
                disabled={submitting || answer.trim() === ""}
              >
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

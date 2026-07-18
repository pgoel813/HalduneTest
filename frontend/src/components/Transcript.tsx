import { topicIndex, topicLabel } from "../lib/questionBank";
import type { Turn } from "../types";

interface TranscriptProps {
  turns: Turn[];
}

/** Scrollable running log of all answered Q&A turns. */
export function Transcript({ turns }: TranscriptProps) {
  return (
    <aside
      className="panel flex flex-col"
      style={{ height: "calc(100vh - 3.5rem - 4rem)", position: "sticky", top: "5rem" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-line)" }}
      >
        <span className="label-mono" style={{ color: "var(--color-ink-dim)" }}>
          TRANSCRIPT
        </span>
        <span className="label-mono">{turns.length} ENTRIES</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {turns.length === 0 ? (
          <div className="px-4 py-6">
            <span className="label-mono" style={{ color: "var(--color-ink-faint)" }}>
              NO ENTRIES YET
            </span>
          </div>
        ) : (
          <ol className="m-0 p-0" style={{ listStyle: "none" }}>
            {turns.map((t, i) => (
              <li
                key={t.id ?? i}
                className="px-4 py-3"
                style={{ borderBottom: "1px solid var(--color-line)" }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="label-mono" style={{ color: "var(--color-steel-bright)" }}>
                    {t.is_followup
                      ? "FOLLOW-UP"
                      : `T${topicIndex(t.topic)} · ${topicLabel(t.topic)}`}
                  </span>
                </div>
                <p
                  style={{
                    color: "var(--color-ink-dim)",
                    fontSize: 13,
                    margin: "0 0 6px",
                    lineHeight: 1.45,
                  }}
                >
                  {t.question_text}
                </p>
                <p
                  style={{
                    color: "var(--color-ink)",
                    fontSize: 13.5,
                    margin: 0,
                    lineHeight: 1.5,
                    paddingLeft: 10,
                    borderLeft: "2px solid var(--color-line-bright)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {t.answer_text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

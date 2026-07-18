import { TOTAL_TOPICS } from "../lib/questionBank";

interface StepIndicatorProps {
  current: number; // 1-based current topic
  total?: number;
}

/** Segmented progress bar across all topics — filled / active / pending. */
export function StepIndicator({ current, total = TOTAL_TOPICS }: StepIndicatorProps) {
  const segments = Array.from({ length: total }, (_, i) => i + 1);
  const clampedCurrent = Math.min(current, total);
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-label="Debrief topic progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={clampedCurrent}
        aria-valuetext={`Topic ${clampedCurrent} of ${total}`}
      >
        {segments.map((n) => {
          const state = n < current ? "done" : n === current ? "active" : "pending";
          const color =
            state === "done"
              ? "var(--color-olive)"
              : state === "active"
                ? "var(--color-amber)"
                : "var(--color-line-bright)";
          return (
            <div
              key={n}
              title={`Topic ${n}`}
              aria-hidden
              style={{
                flex: 1,
                height: 4,
                backgroundColor: color,
                boxShadow: state === "active" ? "0 0 6px var(--color-amber)" : "none",
                transition: "background-color 0.2s ease",
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="label-mono">TOPIC PROGRESS</span>
        <span
          className="label-mono"
          style={{ color: "var(--color-ink-dim)" }}
        >
          {Math.min(current, total)} / {total}
        </span>
      </div>
    </div>
  );
}

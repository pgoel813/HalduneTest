interface MessageProps {
  message?: string;
}

/** Inline loading indicator with a scanning bar. */
export function Loading({ message = "LOADING" }: MessageProps) {
  return (
    <div className="flex flex-col items-start gap-3 py-8" role="status" aria-live="polite">
      <span className="label-mono" style={{ color: "var(--color-ink-dim)" }}>
        {message}
      </span>
      <div
        style={{
          width: 180,
          height: 2,
          backgroundColor: "var(--color-line)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            height: "100%",
            width: "40%",
            backgroundColor: "var(--color-amber)",
            animation: "scan 1.1s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`@keyframes scan { 0% { left: -40%; } 100% { left: 100%; } }`}</style>
    </div>
  );
}

/** Visible, non-silent error surface. */
export function ErrorNotice({ message = "Operation failed." }: MessageProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4"
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid color-mix(in srgb, var(--color-rust) 55%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--color-rust) 10%, transparent)",
      }}
    >
      <span
        className="label-mono"
        style={{ color: "var(--color-rust)", marginTop: 1, flexShrink: 0 }}
      >
        FAULT
      </span>
      <span style={{ color: "var(--color-ink)", fontSize: 14, wordBreak: "break-word" }}>
        {message}
      </span>
    </div>
  );
}

/** Empty-state placeholder. */
export function EmptyNotice({ message = "No records." }: MessageProps) {
  return (
    <div
      className="flex items-center justify-center py-16"
      style={{
        border: "1px dashed var(--color-line-bright)",
        borderRadius: "var(--radius)",
      }}
    >
      <span className="label-mono" style={{ color: "var(--color-ink-faint)" }}>
        {message}
      </span>
    </div>
  );
}

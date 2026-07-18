import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface ShellProps {
  children: ReactNode;
}

/** Persistent application frame: top command bar + content area. */
export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-full flex flex-col">
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 h-14 border-b"
        style={{
          borderColor: "var(--color-line)",
          backgroundColor: "color-mix(in srgb, var(--color-void) 85%, transparent)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Link to="/" className="flex items-center gap-3 no-underline">
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              backgroundColor: "var(--color-amber)",
              boxShadow: "0 0 8px var(--color-amber)",
            }}
          />
          <span
            className="font-mono"
            style={{
              color: "var(--color-ink)",
              fontWeight: 600,
              letterSpacing: "0.22em",
              fontSize: 14,
            }}
          >
            DEBRIEF
          </span>
          <span
            className="label-mono"
            style={{ letterSpacing: "0.16em", color: "var(--color-ink-faint)" }}
          >
            POST-MISSION REPORTING
          </span>
        </Link>
        <span className="label-mono" style={{ color: "var(--color-ink-faint)" }}>
          RESTRICTED // OPERATOR USE
        </span>
      </header>
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}

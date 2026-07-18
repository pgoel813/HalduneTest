import type { DebriefStatus } from "../types";

interface StatusBadgeProps {
  status: DebriefStatus;
}

interface BadgeStyle {
  label: string;
  color: string;
  border: string;
  bg: string;
}

function styleFor(status: DebriefStatus): BadgeStyle {
  const normalized = status?.toLowerCase?.() ?? "";
  switch (normalized) {
    case "complete":
    case "completed":
      return {
        label: "COMPLETE",
        color: "var(--color-olive)",
        border: "color-mix(in srgb, var(--color-olive) 50%, transparent)",
        bg: "color-mix(in srgb, var(--color-olive) 12%, transparent)",
      };
    case "in_progress":
      return {
        label: "IN PROGRESS",
        color: "var(--color-amber)",
        border: "color-mix(in srgb, var(--color-amber) 50%, transparent)",
        bg: "color-mix(in srgb, var(--color-amber) 12%, transparent)",
      };
    default:
      return {
        label: (status || "UNKNOWN").toUpperCase().replace(/_/g, " "),
        color: "var(--color-steel-bright)",
        border: "color-mix(in srgb, var(--color-steel) 50%, transparent)",
        bg: "color-mix(in srgb, var(--color-steel) 12%, transparent)",
      };
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = styleFor(status);
  return (
    <span
      className="label-mono inline-flex items-center"
      style={{
        color: s.color,
        borderColor: s.border,
        backgroundColor: s.bg,
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: "var(--radius)",
        padding: "3px 8px",
        letterSpacing: "0.12em",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          backgroundColor: s.color,
          marginRight: 7,
          display: "inline-block",
        }}
      />
      {s.label}
    </span>
  );
}

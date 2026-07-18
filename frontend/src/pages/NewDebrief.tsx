import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createDebrief, errorMessage } from "../lib/api";
import { ErrorNotice, InlineSpinner } from "../components/States";
import { useDocumentTitle } from "../lib/useDocumentTitle";

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label-mono" style={{ color: "var(--color-ink-dim)" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span style={{ color: "var(--color-ink-faint)", fontSize: 12 }}>{hint}</span>
      )}
    </label>
  );
}

export function NewDebrief() {
  useDocumentTitle("New Debrief");
  const navigate = useNavigate();
  const [operatorName, setOperatorName] = useState("");
  const [missionName, setMissionName] = useState("");
  const [missionDate, setMissionDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const valid =
    operatorName.trim() !== "" &&
    missionName.trim() !== "" &&
    missionDate.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Guard the handler itself, not just the button — blocks double-submit
    // even if invoked again before React re-renders the disabled state.
    if (!valid || inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createDebrief({
        operator_name: operatorName.trim(),
        mission_name: missionName.trim(),
        mission_date: missionDate,
      });
      navigate(`/debrief/${created.id}`);
    } catch (err: unknown) {
      setError(errorMessage(err));
      setSubmitting(false);
      inFlightRef.current = false;
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-8">
      <Link
        to="/"
        className="label-mono no-underline"
        style={{ color: "var(--color-ink-faint)" }}
      >
        ← MISSION LOG
      </Link>

      <div className="mt-4 mb-6">
        <div className="label-mono mb-2">NEW RECORD</div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "var(--color-ink)",
            margin: 0,
          }}
        >
          Initiate Debrief
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel flex flex-col gap-5 p-6"
        aria-label="Initiate new debrief"
        aria-busy={submitting}
      >
        <Field label="Operator Name">
          <input
            className="field"
            type="text"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            placeholder="e.g. SSG R. MARTINEZ"
            aria-label="Operator name"
            aria-required="true"
            autoFocus
            required
          />
        </Field>

        <Field label="Mission Name">
          <input
            className="field"
            type="text"
            value={missionName}
            onChange={(e) => setMissionName(e.target.value)}
            placeholder="e.g. OP IRON THRESHOLD"
            aria-label="Mission name"
            aria-required="true"
            required
          />
        </Field>

        <Field label="Mission Date">
          <input
            className="field"
            type="date"
            value={missionDate}
            onChange={(e) => setMissionDate(e.target.value)}
            style={{ colorScheme: "dark", fontFamily: "var(--font-mono)" }}
            aria-label="Mission date"
            aria-required="true"
            required
          />
        </Field>

        {error && <ErrorNotice message={error} />}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Link to="/" className="btn btn-ghost no-underline" aria-label="Cancel and return to mission log">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!valid || submitting}
            aria-label="Begin interview"
            aria-busy={submitting}
          >
            {submitting && <InlineSpinner />}
            {submitting ? "Initiating…" : "Begin Interview"}
          </button>
        </div>
      </form>
    </div>
  );
}

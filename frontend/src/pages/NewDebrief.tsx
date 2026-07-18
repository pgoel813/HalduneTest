import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createDebrief, errorMessage } from "../lib/api";
import { ErrorNotice } from "../components/States";

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
  const navigate = useNavigate();
  const [operatorName, setOperatorName] = useState("");
  const [missionName, setMissionName] = useState("");
  const [missionDate, setMissionDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    operatorName.trim() !== "" &&
    missionName.trim() !== "" &&
    missionDate.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
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

      <form onSubmit={handleSubmit} className="panel flex flex-col gap-5 p-6">
        <Field label="Operator Name">
          <input
            className="field"
            type="text"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            placeholder="e.g. SSG R. MARTINEZ"
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
            required
          />
        </Field>

        {error && <ErrorNotice message={error} />}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Link to="/" className="btn btn-ghost no-underline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={!valid || submitting}>
            {submitting ? "Initiating…" : "Begin Interview"}
          </button>
        </div>
      </form>
    </div>
  );
}

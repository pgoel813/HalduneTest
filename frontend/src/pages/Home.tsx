import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, listDebriefs } from "../lib/api";
import { formatDate, formatDateTime } from "../lib/format";
import type { DebriefSummary } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyNotice, ErrorNotice, Loading } from "../components/States";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function Home() {
  useDocumentTitle("Mission Log");
  const [debriefs, setDebriefs] = useState<DebriefSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    listDebriefs()
      .then((data) => {
        if (active) setDebriefs(data);
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="label-mono mb-2">MISSION LOG</div>
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 26,
              fontWeight: 600,
              color: "var(--color-ink)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Debrief Records
          </h1>
        </div>
        <Link
          to="/new"
          className="btn btn-primary no-underline"
          aria-label="Create a new debrief"
        >
          + New Debrief
        </Link>
      </div>

      {error && <ErrorNotice message={error} />}
      {!error && debriefs === null && <Loading message="RETRIEVING RECORDS" />}
      {!error && debriefs !== null && debriefs.length === 0 && (
        <EmptyNotice message="NO DEBRIEFS ON RECORD — INITIATE A NEW DEBRIEF" />
      )}

      {!error && debriefs !== null && debriefs.length > 0 && (
        <div className="panel" style={{ overflowX: "auto" }}>
          <table
            className="w-full border-collapse"
            style={{ fontSize: 14, minWidth: 640 }}
          >
            <caption className="sr-only">Past mission debriefs</caption>
            <thead>
              <tr>
                {["MISSION", "OPERATOR", "MISSION DATE", "STATUS", "LOGGED"].map((h) => (
                  <th
                    key={h}
                    className="label-mono text-left"
                    style={{
                      padding: "10px 16px",
                      borderBottom: "1px solid var(--color-line)",
                      backgroundColor: "var(--color-panel-2)",
                      color: "var(--color-ink-faint)",
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {debriefs.map((d) => (
                <tr key={d.id} className="debrief-row">
                  <td style={cellStyle}>
                    <Link
                      to={
                        d.status === "complete" || d.status === "completed"
                          ? `/debrief/${d.id}/summary`
                          : `/debrief/${d.id}`
                      }
                      className="no-underline"
                      style={{ color: "var(--color-ink)", fontWeight: 500 }}
                    >
                      {d.mission_name}
                    </Link>
                  </td>
                  <td style={{ ...cellStyle, color: "var(--color-ink-dim)" }}>
                    {d.operator_name}
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      color: "var(--color-ink-dim)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                    }}
                  >
                    {formatDate(d.mission_date)}
                  </td>
                  <td style={cellStyle}>
                    <StatusBadge status={d.status} />
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      color: "var(--color-ink-faint)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    {formatDateTime(d.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <style>{`
            .debrief-row { border-top: 1px solid var(--color-line); transition: background-color 0.1s ease; }
            .debrief-row:hover { background-color: var(--color-panel-2); }
          `}</style>
        </div>
      )}
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "13px 16px",
  verticalAlign: "middle",
};

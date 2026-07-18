import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import { completeDebrief, errorMessage } from "../lib/api";
import { ErrorNotice, Loading } from "../components/States";
import { markdownComponents } from "../components/markdownComponents";

export function Summary() {
  const { id = "" } = useParams();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setError(null);
    completeDebrief(id)
      .then((res) => {
        if (active) setMarkdown(res.summary_markdown ?? "");
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="label-mono mb-2" style={{ color: "var(--color-olive)" }}>
            DEBRIEF COMPLETE
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "var(--color-ink)",
              margin: 0,
            }}
          >
            After-Action Report
          </h1>
        </div>
        <Link to="/" className="btn btn-ghost no-underline">
          ← All Debriefs
        </Link>
      </div>

      {error && <ErrorNotice message={error} />}
      {!error && markdown === null && <Loading message="COMPILING REPORT" />}

      {!error && markdown !== null && (
        <article
          className="panel"
          style={{ padding: "2.25rem 2.5rem" }}
        >
          <div
            aria-hidden
            className="label-mono mb-6 pb-4"
            style={{
              borderBottom: "1px solid var(--color-line)",
              color: "var(--color-ink-faint)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>AFTER-ACTION REVIEW</span>
            <span>RECORD ID · {id}</span>
          </div>
          <div className="report-body">
            <Markdown components={markdownComponents}>{markdown}</Markdown>
          </div>
        </article>
      )}

      {!error && markdown !== null && (
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="label-mono no-underline"
            style={{ color: "var(--color-ink-faint)" }}
          >
            ← RETURN TO ALL DEBRIEFS
          </Link>
        </div>
      )}
    </div>
  );
}

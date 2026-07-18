import type { Components } from "react-markdown";

/**
 * Styling map for react-markdown so the after-action report renders as a
 * formal document within the dark tactical theme. No external CSS framework
 * prose plugin — explicit, self-contained element styles.
 */
export const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1
      style={{
        fontSize: 22,
        fontWeight: 600,
        color: "var(--color-ink)",
        margin: "0 0 0.75rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid var(--color-line)",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="label-mono"
      style={{
        fontSize: 13,
        color: "var(--color-amber)",
        letterSpacing: "0.14em",
        margin: "1.75rem 0 0.75rem",
        fontWeight: 600,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      style={{
        fontSize: 15,
        fontWeight: 600,
        color: "var(--color-ink)",
        margin: "1.25rem 0 0.5rem",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      style={{
        color: "var(--color-ink-dim)",
        fontSize: 15,
        lineHeight: 1.65,
        margin: "0 0 0.9rem",
      }}
    >
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: "0 0 1rem", paddingLeft: "1.1rem", listStyle: "none" }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      style={{
        margin: "0 0 1rem",
        paddingLeft: "1.4rem",
        color: "var(--color-ink-dim)",
      }}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li
      style={{
        color: "var(--color-ink-dim)",
        fontSize: 15,
        lineHeight: 1.6,
        margin: "0 0 0.4rem",
        position: "relative",
        paddingLeft: "0.35rem",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "-0.75rem",
          top: "0.55em",
          width: 5,
          height: 5,
          backgroundColor: "var(--color-steel)",
        }}
      />
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong style={{ color: "var(--color-ink)", fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ color: "var(--color-ink)", fontStyle: "italic" }}>{children}</em>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: "var(--color-steel-bright)", textDecoration: "underline" }}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: "0 0 1rem",
        padding: "0.5rem 0 0.5rem 1rem",
        borderLeft: "3px solid var(--color-line-bright)",
        color: "var(--color-ink-faint)",
        fontStyle: "italic",
      }}
    >
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        backgroundColor: "var(--color-void)",
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius)",
        padding: "1px 5px",
        color: "var(--color-amber-bright)",
      }}
    >
      {children}
    </code>
  ),
  hr: () => (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid var(--color-line)",
        margin: "1.5rem 0",
      }}
    />
  ),
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "0 0 1rem" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          border: "1px solid var(--color-line)",
        }}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th
      className="label-mono"
      style={{
        textAlign: "left",
        padding: "8px 12px",
        borderBottom: "1px solid var(--color-line)",
        backgroundColor: "var(--color-panel-2)",
        color: "var(--color-ink-faint)",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid var(--color-line)",
        color: "var(--color-ink-dim)",
      }}
    >
      {children}
    </td>
  ),
};

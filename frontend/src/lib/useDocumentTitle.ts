import { useEffect } from "react";

const BASE_TITLE = "DEBRIEF // Post-Mission Reporting";

/**
 * Set document.title for the lifetime of a screen, restoring the previous
 * title on unmount. Pass a screen label; the base app name is appended.
 */
export function useDocumentTitle(label: string | null | undefined): void {
  useEffect(() => {
    const previous = document.title;
    document.title = label ? `${label} // DEBRIEF` : BASE_TITLE;
    return () => {
      document.title = previous;
    };
  }, [label]);
}

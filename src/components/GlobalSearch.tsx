// src/components/GlobalSearch.tsx
"use client";

import * as React from "react";
import { useXBay } from "@/lib/store";

export default function GlobalSearch() {
  const term = useXBay((s) => s.term);
  const setTerm = useXBay((s) => s.setTerm);

  const clear = () => {
    if (typeof setTerm === "function") setTerm("");
    else useXBay.setState({ term: "" });
  };

  return (
    <div className="card">
      <div className="card-header">Global Search</div>
      <div className="card-body">
        <div className="relative">
          {/* search icon (decorative) */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>

          {/* extra left padding prevents overlap with the icon */}
          <input
            className="input pl-10"
            type="search"
            placeholder=""
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Search all selected tables"
          />

          {/* clear button (only appears when there is text) */}
          {term && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--text)]"
              title="Clear"
            >
              Clear
            </button>
          )}
        </div>

        <p className="mt-2 text-xs text-[var(--muted)]">
          Search across all columns in selected tables… (case-insensitive).
        </p>
      </div>
    </div>
  );
}

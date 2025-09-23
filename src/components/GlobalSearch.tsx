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
          {/* icon removed */}
          <input
            className="input"
            type="search"
            placeholder=""
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Search all selected tables"
          />
        </div>

        <p className="mt-2 text-xs text-[var(--muted)]">
          Search across all columns in selected tables… (case-insensitive).
        </p>
      </div>
    </div>
  );
}

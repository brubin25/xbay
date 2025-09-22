// src/components/ResultsLayoutToggle.tsx
"use client";

import * as React from "react";
import { useXBay, type ResultsLayout } from "@/lib/store";

export default function ResultsLayoutToggle() {
  const layout = useXBay((s) => s.resultsLayout);
  const setLayout = useXBay((s) => s.setResultsLayout);

  const btn = (val: ResultsLayout, label: string) => (
    <button
      key={val}
      onClick={() => setLayout(val)}
      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
        layout === val
          ? "bg-[var(--accent)] text-black border-transparent"
          : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
      }`}
      aria-pressed={layout === val}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--muted)]">Results layout:</span>
      <div className="inline-flex items-center gap-1">
        {btn("single", "Single")}
        {btn("stacked", "Stacked")}
      </div>
    </div>
  );
}
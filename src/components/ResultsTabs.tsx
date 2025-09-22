// src/components/ResultsTabs.tsx
"use client";

import * as React from "react";

type Props = {
  tables: string[];
  activeIndex: number;
  onChange: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function ResultsTabs({ tables, activeIndex, onChange, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div
        className="flex items-center gap-2 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
        aria-label="Result tables"
        role="tablist"
      >
        {tables.map((t, i) => (
          <button
            key={t}
            role="tab"
            aria-selected={i === activeIndex}
            onClick={() => onChange(i)}
            className={`chip capitalize ${i === activeIndex ? "chip-active" : ""}`}
            title={`Show ${t}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost text-xs" onClick={onPrev} aria-label="Previous table">
          Prev table
        </button>
        <button className="btn btn-ghost text-xs" onClick={onNext} aria-label="Next table">
          Next table
        </button>
      </div>
    </div>
  );
}

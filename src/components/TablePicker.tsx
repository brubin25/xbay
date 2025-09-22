// src/components/TablePicker.tsx
"use client";
import * as React from "react";
import { useXBay } from "@/lib/store";

const ALL = ["patients", "encounters", "orders", "medications", "lab_results"] as const;

export default function TablePicker() {
  const selected = useXBay((s) => s.selected);
  const setSelected = useXBay((s) => s.setSelected);

  const apply = (next: typeof selected) => {
    if (typeof setSelected === "function") setSelected(next as any);
    else useXBay.setState({ selected: next as any });
  };

  const toggle = (t: (typeof ALL)[number]) => {
    const next = selected.includes(t)
      ? (selected.filter((x) => x !== t) as typeof selected)
      : ([...selected, t] as typeof selected);
    apply(next);
  };

  return (
    <div className="card">
      <div className="card-header">Dataset</div>
      <div className="card-body space-y-3">
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => apply([...ALL])}>
            Select All
          </button>
          <button className="btn btn-ghost" onClick={() => apply([] as any)}>
            Clear
          </button>
        </div>
        <div className="chips">
          {ALL.map((t) => {
            const active = selected.includes(t);
            return (
              <button
                key={t}
                className={`chip ${active ? "chip-active" : ""}`}
                onClick={() => toggle(t)}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

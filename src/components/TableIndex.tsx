"use client";

import * as React from "react";
import { useXBay, ALL_TABLES, type TableName } from "@/lib/store";

type Props = {
  counts?: Record<string, number> | null; // totals or match counts (your page already computes this)
};

export default function TableIndex({ counts }: Props) {
  const selected = useXBay((s) => s.selected);
  const activeTab = useXBay((s) => s.activeTab);
  const setSelected = useXBay((s) => s.setSelected);
  const openTab = useXBay((s) => s.openTab);

  const [q, setQ] = React.useState("");

  const list = React.useMemo(() => {
    const norm = q.trim().toLowerCase();
    const arr = ALL_TABLES.filter((t) => (norm ? t.toLowerCase().includes(norm) : true));
    return arr;
  }, [q]);

  return (
    <div className="card">
      <div className="card-header">Dataset</div>
      <div className="card-body space-y-3">
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setSelected(ALL_TABLES)}>Select All</button>
          <button className="btn btn-outline" onClick={() => setSelected([])}>Clear</button>
        </div>

        <input
          className="input"
          placeholder="Find a table…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <ul className="space-y-2">
          {list.map((t) => {
            const isOpen = selected.includes(t);
            const isActive = activeTab === t;
            const count = counts?.[t] ?? null;
            return (
              <li key={t}>
                <button
                  onClick={() => openTab(t)}
                  className={[
                    "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
                    isActive
                      ? "border-[var(--accent)] bg-[var(--chip-active)] text-[var(--text)]"
                      : "border-[var(--border)] bg-[var(--chip)] text-[var(--muted)] hover:text-[var(--text)]",
                  ].join(" ")}
                >
                  <span className="capitalize">
                    {t} {isOpen ? <span className="text-[10px] ml-1 align-middle">(open)</span> : null}
                  </span>
                  {count !== null && (
                    <span className="badge">{Number(count).toLocaleString()}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-[var(--muted)]">
          Click to open a table in the main viewer. Use the tabs above the grid to switch or close.
        </p>
      </div>
    </div>
  );
}

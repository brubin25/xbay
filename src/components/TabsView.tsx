"use client";

import * as React from "react";
import { useXBay, type TableName } from "@/lib/store";
import DataGrid from "@/components/DataGrid";

type Props = {
  // Feed the same results object you already keep in zustand
  results: Partial<Record<TableName, any>>;
};

export default function TabsView({ results }: Props) {
  const selected = useXBay((s) => s.selected);
  const activeTab = useXBay((s) => s.activeTab);
  const setActiveTab = useXBay((s) => s.setActiveTab);
  const closeTab = useXBay((s) => s.closeTab);

  if (selected.length === 0) {
    return (
      <div className="card">
        <div className="card-header">Results</div>
        <div className="card-body text-sm text-[var(--muted)]">
          Select a table from the left to open it here.
        </div>
      </div>
    );
  }

  const current = activeTab && results[activeTab];

  return (
    <section className="card">
      {/* Tab bar */}
      <div className="toolbar overflow-x-auto">
        <div className="flex items-center gap-2">
          {selected.map((t) => {
            const isActive = t === activeTab;
            return (
              <div
                key={t}
                className={[
                  "flex items-center rounded-xl border px-3 py-1 text-sm whitespace-nowrap",
                  isActive
                    ? "border-[var(--accent)] bg-[var(--chip-active)] text-[var(--text)]"
                    : "border-[var(--border)] bg-[var(--chip)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer",
                ].join(" ")}
                onClick={() => setActiveTab(t)}
              >
                <span className="capitalize">{t}</span>
                <button
                  className="ml-2 text-[var(--muted)] hover:text-[var(--text)]"
                  title="Close"
                  onClick={(e) => { e.stopPropagation(); closeTab(t); }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active table */}
      <div className="p-3">
        {activeTab ? (
          <DataGrid title={activeTab} data={current as any} />
        ) : (
          <div className="text-sm text-[var(--muted)] p-6">
            No active tab. Open a table from the left.
          </div>
        )}
      </div>
    </section>
  );
}
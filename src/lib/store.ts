// src/lib/store.ts
"use client";

import { create } from "zustand";

export type TableName = "patients" | "encounters" | "orders" | "medications" | "lab_results";
export const ALL_TABLES: TableName[] = ["patients", "encounters", "orders", "medications", "lab_results"];

// --- Filter clause types (compact but covers most needs) ---
export type FilterClause =
  | { kind: "text"; op: "contains" | "equals" | "starts" | "ends"; value: string }
  | { kind: "enum"; mode: "include" | "exclude"; values: string[] }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "date"; from?: string; to?: string } // ISO (YYYY-MM-DD or full ISO)
  | { kind: "boolean"; value: boolean | null };

export type DynFilters = Partial<Record<TableName, Record<string, FilterClause>>>;

type ResultsMap = Partial<Record<TableName, any>>;

/* simple panel keys so cards can open a larger view (e.g., filters sheet) */
export type PanelKey = "filters" | "dataset" | "search" | null;

/* NEW: results layout mode */
export type ResultsLayout = "single" | "stacked";

type XBayState = {
  selected: TableName[];
  term: string;
  loading: boolean;
  results: ResultsMap;

  setSelected: (sel: TableName[]) => void;
  setTerm: (s: string) => void;
  setLoading: (b: boolean) => void;
  setResult: (t: TableName, r: any) => void;

  // dynamic filters
  dynFilters: DynFilters;

  setFilter: (t: TableName, field: string, clause: FilterClause | null) => void;
  clearFilter: (t: TableName, field: string) => void;
  clearTableFilters: (t: TableName) => void;
  clearAllFilters: () => void;

  ensureAllSelectedOnce?: boolean;

  /* lightweight UI state for opening/closing a larger panel */
  uiOpenPanel: PanelKey;
  openPanel: (k: Exclude<PanelKey, null>) => void;
  closePanel: () => void;

  /* NEW: results display state */
  resultsLayout: ResultsLayout;
  setResultsLayout: (layout: ResultsLayout) => void;

  activeTableIndex: number;
  setActiveTableIndex: (i: number) => void;
};

export const useXBay = create<XBayState>()((set, get) => {
  // hydrate preferred layout (client-only)
  let initialLayout: ResultsLayout = "stacked";
  try {
    const saved = localStorage.getItem("xbay.resultsLayout");
    if (saved === "single" || saved === "stacked") initialLayout = saved;
  } catch {}

  return {
    selected: ALL_TABLES,
    term: "",
    loading: false,
    results: {},

    setSelected: (sel) => set({ selected: sel }),
    setTerm: (s) => set({ term: s }),
    setLoading: (b) => set({ loading: b }),
    setResult: (t, r) => set({ results: { ...get().results, [t]: r } }),

    // filter state
    dynFilters: {},

    setFilter: (t, field, clause) => {
      const prev = get().dynFilters;
      const next: DynFilters = { ...prev, [t]: { ...(prev[t] || {}) } };
      if (clause === null) delete next[t]![field];
      else next[t]![field] = clause;
      if (next[t] && Object.keys(next[t]!).length === 0) delete next[t];
      set({ dynFilters: next });
    },

    clearFilter: (t, field) => {
      const prev = get().dynFilters;
      const next: DynFilters = { ...prev, [t]: { ...(prev[t] || {}) } };
      delete next[t]![field];
      if (next[t] && Object.keys(next[t]!).length === 0) delete next[t];
      set({ dynFilters: next });
    },

    clearTableFilters: (t) => {
      const prev = get().dynFilters;
      const next: DynFilters = { ...prev };
      delete next[t];
      set({ dynFilters: next });
    },

    clearAllFilters: () => set({ dynFilters: {} }),

    // UI panel state
    uiOpenPanel: null,
    openPanel: (k) => set({ uiOpenPanel: k }),
    closePanel: () => set({ uiOpenPanel: null }),

    // NEW: results layout + active table
    resultsLayout: initialLayout,
    setResultsLayout: (layout) => {
      try {
        localStorage.setItem("xbay.resultsLayout", layout);
      } catch {}
      set({ resultsLayout: layout });
    },

    activeTableIndex: 0,
    setActiveTableIndex: (i) => set({ activeTableIndex: Math.max(0, Math.floor(i)) }),
  };
});

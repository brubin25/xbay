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

  /* NEW: tiny, privacy-safe metrics for a mini chart in Status */
  searchEvents: number[]; // epoch ms timestamps of completed searches
  logSearchEvent: () => void;
  getSearchSeries: (windowMinutes?: number, buckets?: number) => {
    counts: number[];
    total: number;
    max: number;
  };
};

export const useXBay = create<XBayState>()((set, get) => {
  // hydrate preferred layout (client-only)
  let initialLayout: ResultsLayout = "stacked";
  try {
    const saved = localStorage.getItem("xbay.resultsLayout");
    if (saved === "single" || saved === "stacked") initialLayout = saved;
  } catch {}

  // hydrate local search activity (optional; safe to fail)
  let initialSearchEvents: number[] = [];
  try {
    const raw = localStorage.getItem("xbay.searchEvents");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) initialSearchEvents = parsed.filter((n) => typeof n === "number");
    }
  } catch {}

  const persistSearchEvents = (events: number[]) => {
    try {
      localStorage.setItem("xbay.searchEvents", JSON.stringify(events));
    } catch {}
  };

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

    // NEW: search metrics
    searchEvents: initialSearchEvents,
    logSearchEvent: () => {
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const events = [...get().searchEvents, now].filter((t) => now - t <= oneWeekMs);
      persistSearchEvents(events);
      set({ searchEvents: events });
    },
    getSearchSeries: (windowMinutes = 60, buckets = 24) => {
      const now = Date.now();
      const windowMs = Math.max(1, windowMinutes) * 60_000;
      const start = now - windowMs;
      const step = Math.max(1, Math.floor(windowMs / Math.max(1, buckets)));
      const counts = new Array(Math.max(1, buckets)).fill(0) as number[];

      for (const t of get().searchEvents) {
        if (t < start || t > now) continue;
        let idx = Math.floor((t - start) / step);
        if (idx >= counts.length) idx = counts.length - 1;
        counts[idx]++;
      }
      const total = counts.reduce((a, b) => a + b, 0);
      const max = counts.reduce((m, n) => (n > m ? n : m), 0);
      return { counts, total, max };
    },
  };
});

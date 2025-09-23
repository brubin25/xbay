// src/app/explore/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import TablePicker from "@/components/TablePicker";
import GlobalSearch from "@/components/GlobalSearch";
import DataGrid from "@/components/DataGrid";
import FiltersPro from "@/components/FiltersPro";
import PanelRoot from "@/components/PanelRoot";
import ResultsLayoutToggle from "@/components/ResultsLayoutToggle";
import ResultsTabs from "@/components/ResultsTabs";
import { registerDefaultCSVs, getRowCounts } from "@/lib/duckdb";
import { useXBay } from "@/lib/store";
import { runGlobalSearch, getAllMatchCounts } from "@/lib/query";

export default function Page() {
  const selected = useXBay((s) => s.selected);
  const term = useXBay((s) => s.term);
  const dynFilters = useXBay((s) => s.dynFilters);
  const setLoading = useXBay((s) => s.setLoading);
  const setResult = useXBay((s) => s.setResult);
  const loading = useXBay((s) => s.loading);
  const results = useXBay((s) => s.results);

  // NEW (display-only state)
  const resultsLayout = useXBay((s) => s.resultsLayout);
  const activeTableIndex = useXBay((s) => s.activeTableIndex);
  const setActiveTableIndex = useXBay((s) => s.setActiveTableIndex);

  const [counts, setCounts] = useState<Record<string, number> | null>(null);           // totals
  const [matchCounts, setMatchCounts] = useState<Record<string, number> | null>(null); // filtered when searching
  const [initError, setInitError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resultLen = (r: any): number =>
    Array.isArray(r) ? r.length : Array.isArray(r?.rows) ? r.rows.length : Number(r?.total || r?.count || 0);

  // -------- initial boot (data/queries unchanged)
  useEffect(() => {
    (async () => {
      setInitError(null);
      setLoading(true);
      try {
        await registerDefaultCSVs();
        const c = await getRowCounts();
        setCounts(c);
        setReady(true);
        for (const t of selected) {
          const r = await runGlobalSearch(t as any, term, dynFilters);
          setResult(t as any, r);
        }
      } catch (e: any) {
        setInitError(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- re-run when selected / term / filters change (unchanged)
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const errs: Record<string, string> = {};
      try {
        for (const t of selected) {
          try {
            const r = await runGlobalSearch(t as any, term, dynFilters);
            if (!cancelled) setResult(t as any, r);
          } catch (err: any) {
            errs[t] = String(err?.message ?? err);
          }
        }
      } finally {
        if (!cancelled) setErrors(errs);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, selected, term, dynFilters, setLoading, setResult]);

  // -------- live counts for Status (unchanged)
  const hasTermOrFilters =
    (term ?? "").trim().length > 0 || Object.keys(dynFilters || {}).length > 0;

  useEffect(() => {
    if (!ready) return;
    if (!hasTermOrFilters) {
      setMatchCounts(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mc = await getAllMatchCounts(term || "", dynFilters);
        if (!cancelled) setMatchCounts(mc);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, term, dynFilters, hasTermOrFilters]);

  // Which tables are visible (unchanged)
  const visibleTables = useMemo(() => {
    if (!hasTermOrFilters) return selected;
    return selected.filter((tbl) => !errors[tbl] && resultLen((results as any)[tbl]) > 0);
  }, [selected, hasTermOrFilters, results, errors]);

  const displayCounts = hasTermOrFilters && matchCounts ? matchCounts : counts;

  // keep active index in range whenever visibleTables changes (display-only)
  useEffect(() => {
    if (visibleTables.length === 0) {
      setActiveTableIndex(0);
      return;
    }
    if (activeTableIndex >= visibleTables.length) {
      setActiveTableIndex(0);
    }
  }, [visibleTables, activeTableIndex, setActiveTableIndex]);

  const goPrev = () => {
    if (!visibleTables.length) return;
    const next = (activeTableIndex - 1 + visibleTables.length) % visibleTables.length;
    setActiveTableIndex(next);
  };
  const goNext = () => {
    if (!visibleTables.length) return;
    const next = (activeTableIndex + 1) % visibleTables.length;
    setActiveTableIndex(next);
  };

  // --- NEW: data for Status chart (colorful SVG bars)
  const barRows = useMemo<[string, number][]>(() => {
    if (!displayCounts) return [];
    return Object.entries(displayCounts)
      .map(([k, v]) => [k, Number(v) || 0] as [string, number])
      .sort((a, b) => b[1] - a[1]);
  }, [displayCounts]);

  const maxBar = useMemo(() => Math.max(1, ...barRows.map(([, n]) => n)), [barRows]);

  // Pleasant, elegant palette (cycled if more tables appear)
  const palette = [
    "#6366F1", // indigo
    "#06B6D4", // cyan
    "#10B981", // emerald
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // violet
    "#14B8A6", // teal
    "#F97316", // orange
  ];

  const pretty = (k: string) => k.replace(/_/g, " ");

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6">
          <TablePicker />
          <GlobalSearch />
          <FiltersPro />

          <div className="card">
            <div className="card-header">Status</div>
            <div className="card-body text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span>Loading</span>
                <span className="badge">{String(loading)}</span>
              </div>

              {displayCounts && (
                <div className="mt-2">
                  <div className="text-xs text-[var(--muted)] mb-2">
                    {hasTermOrFilters ? "Matches by table" : "Rows by table"}
                  </div>

                  {/* NEW: Colorful compact bar chart (SVG, responsive width) */}
                  <div className="w-full">
                    <svg
                      role="img"
                      aria-label="Bar chart of row/match counts by table"
                      viewBox="0 0 360 160"
                      width="100%"
                      height="160"
                      style={{ display: "block" }}
                    >
                      <defs>
                        {barRows.map(([, _n], i) => {
                          const c = palette[i % palette.length];
                          const id = `gbar_${i}`;
                          return (
                            <linearGradient id={id} key={id} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={c} stopOpacity="0.95" />
                              <stop offset="100%" stopColor={c} stopOpacity="0.65" />
                            </linearGradient>
                          );
                        })}
                        {/* faint grid line color respects theme */}
                        <pattern id="gridDots" width="8" height="8" patternUnits="userSpaceOnUse">
                          <circle cx="1" cy="1" r="0.6" fill="currentColor" opacity="0.08" />
                        </pattern>
                      </defs>

                      {/* background grid */}
                      <rect x="0" y="0" width="360" height="160" fill="url(#gridDots)" />

                      {/* chart area */}
                      {(() => {
                        const pad = 24;
                        const w = 360 - pad * 2;
                        const h = 120; // leave room for labels
                        const baseY = pad + h;
                        const gap = 10;
                        const n = Math.max(1, barRows.length);
                        const bw = Math.max(10, (w - gap * (n - 1)) / n);

                        return (
                          <>
                            {/* baseline */}
                            <line
                              x1={pad}
                              x2={pad + w}
                              y1={baseY + 0.5}
                              y2={baseY + 0.5}
                              stroke="currentColor"
                              opacity="0.25"
                              strokeWidth="1"
                            />
                            {barRows.map(([k, n], i) => {
                              const x = pad + i * (bw + gap);
                              const bh = Math.max(1, Math.round((n / maxBar) * (h - 14)));
                              const y = baseY - bh;
                              const grad = `url(#gbar_${i})`;
                              const label = pretty(k);

                              return (
                                <g key={k}>
                                  <title>{`${label}: ${n.toLocaleString()}`}</title>
                                  <rect
                                    x={x}
                                    y={y}
                                    width={bw}
                                    height={bh}
                                    fill={grad}
                                    rx="3"
                                  />
                                  {/* value label */}
                                  <text
                                    x={x + bw / 2}
                                    y={y - 6}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill="currentColor"
                                    opacity="0.75"
                                  >
                                    {n.toLocaleString()}
                                  </text>
                                  {/* x label */}
                                  <text
                                    x={x + bw / 2}
                                    y={baseY + 12}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="currentColor"
                                    opacity="0.9"
                                  >
                                    {label}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Keep the existing textual summary (unchanged) */}
                  <ul className="text-xs space-y-1 mt-2">
                    {Object.entries(displayCounts).map(([k, v]) => (
                      <li key={k}>
                        <span className="badge mr-2">{k}</span>
                        {Number(v).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {initError && (
                <p className="text-xs text-red-400 mt-2">Init error: {initError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Layout toggle */}
          <div className="flex items-center justify-end">
            <ResultsLayoutToggle />
          </div>

          {/* Empty state */}
          {selected.length === 0 && (
            <div className="card">
              <div className="card-header">Results</div>
              <div className="card-body text-sm text-[var(--muted)]">
                Select one or more tables to view data.
              </div>
            </div>
          )}

          {/* No matches */}
          {selected.length > 0 && hasTermOrFilters && visibleTables.length === 0 && (
            <div className="card">
              <div className="card-header">Results</div>
              <div className="card-body text-sm text-[var(--muted)]">
                No matches found.
              </div>
            </div>
          )}

          {/* SINGLE MODE */}
          {resultsLayout === "single" && visibleTables.length > 0 && (
            <div className="card">
              <div className="card-header">
                <ResultsTabs
                  tables={visibleTables}
                  activeIndex={activeTableIndex}
                  onChange={setActiveTableIndex}
                  onPrev={goPrev}
                  onNext={goNext}
                />
              </div>
              <div className="card-body p-0">
                <DataGrid
                  title={visibleTables[activeTableIndex]}
                  data={(results as any)[visibleTables[activeTableIndex]]}
                />
              </div>
            </div>
          )}

          {/* STACKED MODE (original vertical list) */}
          {resultsLayout === "stacked" &&
            visibleTables.map((t) => (
              <div key={t}>
                {errors[t] ? (
                  <div className="card">
                    <div className="card-header">{t}</div>
                    <div className="card-body">
                      <p className="text-sm text-red-400">Query error: {errors[t]}</p>
                    </div>
                  </div>
                ) : (
                  <DataGrid title={t} data={(results as any)[t]} />
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Global panel host (unchanged) */}
      <PanelRoot />
    </>
  );
}
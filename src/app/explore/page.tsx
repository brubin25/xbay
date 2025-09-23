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

  // NEW: tiny, privacy-safe search metrics (display only)
  const getSearchSeries = useXBay((s) => s.getSearchSeries);
  const logSearchEvent = useXBay((s) => s.logSearchEvent);

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
        if (!cancelled) {
          setErrors(errs);
          // NEW: count one completed search interaction (once per re-run)
          logSearchEvent();
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, selected, term, dynFilters, setLoading, setResult, logSearchEvent]);

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

  // --- NEW: compute a small search-activity series for the Status card
  // last 60 minutes, 24 buckets -> tiny histogram sparkline
  const searchStats = getSearchSeries(60, 24);
  const maxBucket = Math.max(1, searchStats.max);
  const bars = searchStats.counts;

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
                <span>Engine</span>
                <span className="badge">DuckDB-WASM</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Loading</span>
                <span className="badge">{String(loading)}</span>
              </div>

              {/* NEW: tiny search activity sparkline */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-[var(--muted)]">Search activity (last 60m)</div>
                  <span className="badge" title="Total searches in window">
                    {searchStats.total}
                  </span>
                </div>
                <div className="text-[var(--fg)]/70">
                  <svg
                    className="w-full h-10"
                    viewBox={`0 0 ${bars.length} 100`}
                    preserveAspectRatio="none"
                    aria-label="Searches over time sparkline"
                    role="img"
                  >
                    {bars.map((n, i) => {
                      const h = (n / maxBucket) * 100;
                      return (
                        <rect
                          key={i}
                          x={i + 0.1}
                          y={100 - h}
                          width={0.8}
                          height={h}
                          rx={0.6}
                          fill="currentColor"
                          opacity={0.25 + (n / maxBucket) * 0.65}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {displayCounts && (
                <div className="mt-2">
                  <div className="text-xs text-[var(--muted)] mb-1">
                    {hasTermOrFilters ? "Row counts (matches in all tables)" : "Row counts"}
                  </div>
                  <ul className="text-xs space-y-1">
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

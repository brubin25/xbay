// src/components/FiltersPro.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useXBay, ALL_TABLES, type TableName, type FilterClause } from "@/lib/store";
import { getDistinctValues, listColumns } from "@/lib/query";

const PINNED: Record<TableName, string[]> = {
  patients: ["age", "sex", "home_location"],
  encounters: ["encounter_datetime", "department", "location"],
  orders: ["order_type", "priority", "status", "order_datetime"],
  medications: ["drug_name", "route", "frequency", "start_date", "end_date"],
  lab_results: ["test_name", "result_datetime", "result_value"],
};

function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function Chip({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "px-2.5 py-1 rounded-xl text-xs border",
        active
          ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--fg)]"
          : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
      )}
    >
      {children}
    </button>
  );
}

export default function FiltersPro() {
  const selected = useXBay((s) => s.selected);
  const dynFilters = useXBay((s) => s.dynFilters);
  const setFilter = useXBay((s) => s.setFilter);
  const clearFilter = useXBay((s) => s.clearFilter);
  const clearTableFilters = useXBay((s) => s.clearTableFilters);
  const clearAllFilters = useXBay((s) => s.clearAllFilters);
  const openPanel = useXBay((s) => s.openPanel);

  const [tab, setTab] = useState<TableName>("patients");
  useEffect(() => {
    if (!selected.includes(tab)) {
      const first = (selected[0] as TableName) || "patients";
      setTab(first);
    }
  }, [selected, tab]);

  const chips = useMemo(() => {
    const rows: Array<{ table: TableName; field: string; text: string }> = [];
    for (const t of Object.keys(dynFilters || {}) as TableName[]) {
      const obj = dynFilters[t] || {};
      for (const [field, clause] of Object.entries(obj)) {
        let label = field;
        if (clause.kind === "text") label = `${field} · ${clause.op} · "${clause.value}"`;
        if (clause.kind === "enum")
          label = `${field} · ${clause.mode} · ${clause.values
            .slice(0, 2)
            .join(", ")}${clause.values.length > 2 ? "..." : ""}`;
        if (clause.kind === "number") {
          const segs = [];
          if (clause.min !== undefined) segs.push(`≥ ${clause.min}`);
          if (clause.max !== undefined) segs.push(`≤ ${clause.max}`);
          label = `${field} · ${segs.join(" & ")}`;
        }
        if (clause.kind === "date") {
          const segs = [];
          if (clause.from) segs.push(`from ${clause.from}`);
          if (clause.to) segs.push(`to ${clause.to}`);
          label = `${field} · ${segs.join(" ")}`;
        }
        if (clause.kind === "boolean") label = `${field} · ${clause.value === null ? "any" : clause.value ? "true" : "false"}`;
        rows.push({ table: t as TableName, field, text: label });
      }
    }
    return rows;
  }, [dynFilters]);

  function setText(table: TableName, field: string, op: FilterClause["op"], value: string) {
    setFilter(table, field, value ? { kind: "text", op, value } : null);
  }
  function setEnum(table: TableName, field: string, picked: string[], mode: "include" | "exclude") {
    setFilter(table, field, picked.length ? { kind: "enum", mode, values: picked } : null);
  }
  function setNumber(table: TableName, field: string, min?: number, max?: number) {
    if (min === undefined && max === undefined) setFilter(table, field, null);
    else setFilter(table, field, { kind: "number", min, max });
  }
  function setDate(table: TableName, field: string, from?: string, to?: string) {
    if (!from && !to) setFilter(table, field, null);
    else setFilter(table, field, { kind: "date", from, to });
  }
  function setBool(table: TableName, field: string, v: boolean | null) {
    setFilter(table, field, v === null ? null : { kind: "boolean", value: v });
  }

  // --- enum cache per field (simple local state)
  const [enumCache, setEnumCache] = useState<Record<string, string[]>>({});
  async function ensureDistinct(table: TableName, field: string) {
    const key = `${table}.${field}`;
    if (!enumCache[key]) {
      const vals = await getDistinctValues(table, field, 12);
      setEnumCache((m) => ({ ...m, [key]: vals }));
    }
  }

  const activePinned = useMemo(() => PINNED[tab], [tab]);

  // --- “Add filter…” (long tail fields) with a small retry so we don't query before DB is ready
  const [allFields, setAllFields] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cols = await listColumns(tab);
        if (!cancelled) setAllFields(cols);
      } catch (_e) {
        // DB might not be registered yet; retry shortly
        if (!cancelled) setTimeout(() => setRetryTick((x) => x + 1), 200);
      }
    })();
    return () => { cancelled = true; };
  }, [tab, retryTick]);

  const filteredFields = useMemo(
    () => allFields.filter((c) => c.toLowerCase().includes(query.toLowerCase()) && !activePinned.includes(c)),
    [allFields, query, activePinned]
  );

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Filters</span>
          {chips.length > 0 && <span className="badge">{chips.length}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button className="link" onClick={() => clearAllFilters()}>Clear all</button>
          <button
            className="btn btn-outline"
            onClick={() => openPanel("filters")}
            aria-label="Expand filters"
            title="Expand filters"
          >
            Expand
          </button>
        </div>
      </div>

      <div className="card-body space-y-4">
        {/* Active chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <Chip key={`${c.table}.${c.field}.${i}`} onClick={() => clearFilter(c.table, c.field)} active>
                {c.text} &nbsp;✕
              </Chip>
            ))}
          </div>
        )}

        {/* Tabs */}
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {ALL_TABLES.map((t) => (
            <button
              key={t}
              disabled={!selected.includes(t)}
              onClick={() => setTab(t)}
              className={classNames(
                "px-3 py-1.5 rounded-lg text-xs border shrink-0", // <- prevent squish, allow wrap
                tab === t ? "bg-[var(--card)] border-[var(--accent)]" : "bg-[var(--bg)] border-[var(--border)]",
                !selected.includes(t) && "opacity-40 cursor-not-allowed"
              )}
            >
              {t}
            </button>
          ))}
          {/* Put spacer on its own line when wrapping so content doesn't overflow */}
          <div className="grow basis-full sm:basis-0" />
          <button className="link text-xs mt-1 sm:mt-0" onClick={() => clearTableFilters(tab)}>
            Reset {tab}
          </button>
        </div>
        {/* Pinned fields */}
        <div className="space-y-4">
          {activePinned.map((field) => {
            const current = dynFilters[tab]?.[field];
            const key = `${tab}.${field}`;
            return (
              <div key={key} className="space-y-1">
                <div className="text-xs font-medium text-[var(--muted)]">{field}</div>

                {/* Quick enum */}
                {["sex","department","location","order_type","priority","status","route","frequency","test_name","home_location"].includes(field) && (
                  <div className="flex flex-wrap gap-2">
                    {(enumCache[key] || []).map((v) => {
                      const active = current?.kind === "enum" && current.values.includes(v);
                      return (
                        <Chip
                          key={v}
                          active={active}
                          onClick={() => {
                            const next = new Set<string>(current?.kind === "enum" ? current.values : []);
                            if (next.has(v)) next.delete(v); else next.add(v);
                            setEnum(tab, field, Array.from(next), current?.kind === "enum" ? current.mode : "include");
                          }}
                        >
                          {v}
                        </Chip>
                      );
                    })}
                    <button
                      className="text-xs underline text-[var(--muted)]"
                      onClick={() => ensureDistinct(tab, field)}
                    >
                      {enumCache[key] ? "More..." : "Load values"}
                    </button>
                    {current?.kind === "enum" && (
                      <div className="flex items-center gap-2 ml-2">
                        <label className="text-xs text-[var(--muted)]">Mode</label>
                        <select
                          className="input !w-auto text-xs"
                          value={current.mode}
                          onChange={(e) => setEnum(tab, field, current.values, e.target.value as "include"|"exclude")}
                        >
                          <option value="include">Include</option>
                          <option value="exclude">Exclude</option>
                        </select>
                        <button className="link text-xs" onClick={() => setFilter(tab, field, null)}>Reset</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Number range */}
                {["age","result_value"].includes(field) && (
                  <div className="flex items-center gap-2">
                    <input
                      className="input !w-28"
                      type="number"
                      placeholder="min"
                      value={current?.kind === "number" && current.min !== undefined ? current.min : ""}
                      onChange={(e) => setNumber(tab, field, e.target.value ? Number(e.target.value) : undefined, current?.kind === "number" ? current.max : undefined)}
                    />
                    <span className="text-xs text-[var(--muted)]">to</span>
                    <input
                      className="input !w-28"
                      type="number"
                      placeholder="max"
                      value={current?.kind === "number" && current.max !== undefined ? current.max : ""}
                      onChange={(e) => setNumber(tab, field, current?.kind === "number" ? current.min : undefined, e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <button className="link text-xs" onClick={() => setFilter(tab, field, null)}>Reset</button>
                  </div>
                )}

                {/* Date range */}
                {["encounter_datetime","order_datetime","start_date","end_date","result_datetime","result_date"].includes(field) && (
                  <div className="flex items-center gap-2">
                    <input
                      className="input !w-40"
                      type="date"
                      value={current?.kind === "date" && current.from ? current.from.substring(0,10) : ""}
                      onChange={(e) => setDate(tab, field, e.target.value || undefined, current?.kind === "date" ? current.to : undefined)}
                    />
                    <span className="text-xs text-[var(--muted)]">to</span>
                    <input
                      className="input !w-40"
                      type="date"
                      value={current?.kind === "date" && current.to ? current.to.substring(0,10) : ""}
                      onChange={(e) => setDate(tab, field, current?.kind === "date" ? current.from : undefined, e.target.value || undefined)}
                    />
                    <button className="link text-xs" onClick={() => setFilter(tab, field, null)}>Reset</button>
                  </div>
                )}

                {/* Boolean */}
                {["has_allergy","is_chronic"].includes(field) && (
                  <div className="flex items-center gap-2">
                    {(["any","true","false"] as const).map((v) => (
                      <Chip
                        key={v}
                        active={
                          (v === "any" && (current?.kind !== "boolean")) ||
                          (v === "true" && current?.kind === "boolean" && current.value === true) ||
                          (v === "false" && current?.kind === "boolean" && current.value === false)
                        }
                        onClick={() => setBool(tab, field, v === "any" ? null : v === "true")}
                      >
                        {v}
                      </Chip>
                    ))}
                    <button className="link text-xs" onClick={() => setFilter(tab, field, null)}>Reset</button>
                  </div>
                )}

                {/* Text (default) */}
                {!(
                  ["sex","department","location","order_type","priority","status","route","frequency","test_name","home_location",
                   "age","result_value","encounter_datetime","order_datetime","start_date","end_date","result_datetime","result_date",
                   "has_allergy","is_chronic"].includes(field)
                ) && (
                  <div className="flex items-center gap-2">
                    <select
                      className="input !w-auto text-xs"
                      value={current?.kind === "text" ? current.op : "contains"}
                      onChange={(e) => setText(tab, field, e.target.value as any, current?.kind === "text" ? current.value : "")}
                    >
                      <option value="contains">contains</option>
                      <option value="equals">equals</option>
                      <option value="starts">starts with</option>
                      <option value="ends">ends with</option>
                    </select>
                    <input
                      className="input"
                      placeholder="type to filter..."
                      value={current?.kind === "text" ? current.value : ""}
                      onChange={(e) => setText(tab, field, current?.kind === "text" ? current.op : "contains", e.target.value)}
                    />
                    <button className="link text-xs" onClick={() => setFilter(tab, field, null)}>Reset</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add filter (long tail) */}
        <div className="pt-2">
          <div className="text-xs font-medium text-[var(--muted)] mb-1">Add filter...</div>
          <div className="flex items-center gap-2">
            <input
              className="input"
              placeholder="Search columns..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex gap-1 flex-wrap">
              {filteredFields.slice(0, 6).map((c) => (
                <Chip key={c} onClick={() => {
                  const existing = (dynFilters[tab] || {})[c];
                  if (!existing) setFilter(tab, c, { kind: "text", op: "contains", value: "" });
                }}>
                  + {c}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

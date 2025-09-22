// src/components/DataGrid.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { QueryResult } from "@/lib/types";

type Props = { title: string; data?: QueryResult };

/* ---- helpers / constants ---- */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const LS_KEY = (title: string) => `xbay.gridHeight.${title}`;
const MIN_H = 240;   // keep constants stable to avoid hydration mismatch
const MAX_H = 900;

export default function DataGrid({ title, data }: Props) {
  const rows = React.useMemo(() => data?.rows ?? [], [data]);
  const cols = React.useMemo<ColumnDef<any>[]>(() => {
    if (!data?.columns?.length) return [];
    return data.columns.map((c) => ({
      accessorKey: c,
      header: () => <span className="select-none">{c}</span>,
      cell: (ctx) => {
        const v = ctx.getValue();
        const isNum = typeof v === "number";
        return <span className={isNum ? "num" : ""}>{String(v ?? "")}</span>;
      },
      enableSorting: true,
    }));
  }, [data]);

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: rows,
    columns: cols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 25 } },
  });

  // ----- virtualization -----
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtual = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 8,
  });

  // ----- layout refs for auto-height -----
  const cardRef = React.useRef<HTMLElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const footRef = React.useRef<HTMLDivElement>(null);

  // Height (resizable, per table). Start stable; auto-compute after mount if no saved value.
  const [heightPx, setHeightPx] = React.useState<number>(() => {
    if (typeof window === "undefined") return 480; // SSR-safe default
    const saved = localStorage.getItem(LS_KEY(title));
    return saved ? clamp(parseInt(saved, 10), MIN_H, MAX_H) : 480;
  });

  // Compute an auto height that fills to footer (runs only if not user-set)
  const computeAutoHeight = React.useCallback(() => {
    const card = cardRef.current;
    const bar = toolbarRef.current;
    const foot = footRef.current;
    if (!card || !bar || !foot) return;

    const top = card.getBoundingClientRect().top;
    const viewport = window.innerHeight;

    // non-scroll chrome (toolbar + footer) + small padding
    const nonScroll =
      bar.getBoundingClientRect().height + foot.getBoundingClientRect().height + 32;

    const available = Math.floor(viewport - top - nonScroll - 24); // leave bottom margin
    const next = clamp(available, MIN_H, MAX_H);
    setHeightPx(next);
  }, []);

  // First mount: if no saved height, compute auto height and keep it responsive
  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY(title)) : null;
    if (!saved) {
      const id = requestAnimationFrame(computeAutoHeight);
      const onResize = () => computeAutoHeight();
      window.addEventListener("resize", onResize);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener("resize", onResize);
      };
    }
  }, [title, computeAutoHeight]);

  // Persist height (debounced lightly)
  React.useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY(title), String(heightPx));
      } catch {}
    }, 120);
    return () => clearTimeout(id);
  }, [title, heightPx]);

  // ----- resize handle (mouse + keyboard) -----
  const dragState = React.useRef<{ startY: number; startH: number } | null>(null);

  const onHandlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragState.current = { startY: e.clientY, startH: heightPx };

    const onMove = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const delta = ev.clientY - dragState.current.startY;
      setHeightPx(clamp(dragState.current.startH + delta, MIN_H, MAX_H));
    };
    const onUp = () => {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      dragState.current = null;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const onHandleDoubleClick = () => {
    // reset to auto height and clear saved value
    try { localStorage.removeItem(LS_KEY(title)); } catch {}
    computeAutoHeight();
  };

  const onHandleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = e.key === "ArrowUp" ? -20 : 20;
      setHeightPx((h) => clamp(h + delta, MIN_H, MAX_H));
    } else if (e.key === "Enter") {
      onHandleDoubleClick();
    }
  };

  const exportCSV = () => {
    if (!data?.columns?.length) return;
    const header = data.columns.join(",");
    const body = rows
      .map((r: any) =>
        data.columns.map((c) => `"${String(r[c] ?? "").replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section ref={cardRef} className="card">
      <div ref={toolbarRef} className="toolbar">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold capitalize">{title}</h3>
          <span className="badge">{rows.length.toLocaleString()} rows</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={() => table.setPageIndex(0)}>
            First
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
          <select
            className="input !w-auto"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[25, 50, 100, 250, 500].map((s) => (
              <option key={s} value={s}>
                {s}/page
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={exportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrap">
        {/* Controlled scroll height so the footer stays visible by default */}
        <div ref={parentRef} style={{ height: heightPx, overflow: "auto" }}>
          <table className="table">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none"
                      title="Sort"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{
                        asc: " ▲",
                        desc: " ▼",
                      }[h.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody style={{ height: virtual.getTotalSize() }}>
              {virtual.getVirtualItems().map((vi) => {
                const r = table.getRowModel().rows[vi.index];
                return (
                  <tr key={r.id} style={{ transform: `translateY(${vi.start}px)` }}>
                    {r.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom resize handle */}
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label={`Resize ${title} table`}
          aria-valuemin={MIN_H}
          aria-valuemax={MAX_H}     /* constant to prevent hydration mismatch */
          aria-valuenow={heightPx}
          tabIndex={0}
          onPointerDown={onHandlePointerDown}
          onDoubleClick={onHandleDoubleClick}
          onKeyDown={onHandleKeyDown}
          className="w-full h-2 cursor-row-resize select-none border-t border-[var(--border)]"
          style={{
            background: "linear-gradient(to right, transparent, var(--border), transparent)",
          }}
          title="Drag to resize • Double-click to reset"
        />
      </div>

      <div ref={footRef} className="table-foot">
        <div className="text-xs text-[var(--muted)]">
          Page <span className="kbd">{table.getState().pagination.pageIndex + 1}</span> of{" "}
          <span className="kbd">{table.getPageCount()}</span>
        </div>
        <div className="text-xs text-[var(--muted)]">
          Tips: Drag the handle below to resize and Click a column header to sort.
        </div>
      </div>
    </section>
  );
}

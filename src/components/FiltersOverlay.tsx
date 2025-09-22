"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useXBay } from "@/lib/store";
import FiltersPro from "@/components/FiltersPro";

export default function FiltersOverlay() {
  const openKey = useXBay((s) => s.uiOpenPanel);
  const close = useXBay((s) => s.closePanel);

  const isOpen = openKey === "filters";
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex"
      onClick={close}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="ml-auto h-full w-full max-w-[720px] bg-[var(--card)] border-l border-[var(--border)] shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur p-3 flex items-center justify-between">
          <div className="font-semibold">Filters</div>
          <button className="btn btn-outline" onClick={close}>Close</button>
        </div>
        <div className="p-3">
          {/* Reuse the same compact panel inside the sheet */}
          <FiltersPro />
        </div>
      </div>
    </div>,
    document.body
  );
}
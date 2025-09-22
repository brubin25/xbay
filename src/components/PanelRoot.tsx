// src/components/PanelRoot.tsx
"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useXBay } from "@/lib/store";
import FiltersPro from "@/components/FiltersPro";

export default function PanelRoot() {
  const panel = useXBay((s) => s.uiOpenPanel);
  const closePanel = useXBay((s) => s.closePanel);

  // Close on Esc
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, closePanel]);

  // Prevent background scroll while open
  useEffect(() => {
    if (!panel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [panel]);

  if (!panel) return null;

  const title = panel === "filters" ? "Filters" : "Panel";

  return createPortal(
    <div className="fixed inset-0 z-[999]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={closePanel} />

      {/* Right sheet */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-[720px] bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="toolbar">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn btn-ghost" onClick={closePanel} aria-label="Close panel">Close</button>
        </div>
        <div className="p-4 overflow-auto">
          {panel === "filters" && <FiltersPro />}
        </div>
      </div>
    </div>,
    document.body
  );
}

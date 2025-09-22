// src/components/Sheet.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number; // px, desktop
};

export default function Sheet({ open, onClose, title, children, width = 520 }: SheetProps) {
  const [mounted, setMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  // lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  // focus & ESC close
  React.useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  if (!open) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "sheet-title" : undefined}
      className="fixed inset-0 z-[1000]"
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full w-full sm:w-auto outline-none"
        style={{ width: `min(100%, ${width}px)` }}
      >
        <div className="flex h-full flex-col bg-[var(--card)] border-l border-[var(--border)] shadow-2xl">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border)]">
            <h2 id="sheet-title" className="font-semibold">{title}</h2>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Close">Close</button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {children}
          </div>
          <div className="p-3 text-xs text-[var(--muted)] border-t border-[var(--border)]">
            Press <span className="kbd">Esc</span> to close.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

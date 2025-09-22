// src/components/ThemeToggle.tsx
"use client";

import * as React from "react";

type Mode = "light" | "dark";

function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

function applyTheme(next: Mode) {
  const cl = document.documentElement.classList;
  if (next === "dark") cl.add("dark");
  else cl.remove("dark");
  try {
    localStorage.setItem("xbay-theme", next);
  } catch {}
}

export default function ThemeToggle() {
  const [mode, setMode] = React.useState<Mode>("light");
  const [mounted, setMounted] = React.useState(false);

  // Initialize from localStorage or system preference (avoids FOUC with your layout bootstrap)
  React.useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("xbay-theme") as Mode | null;
      const initial: Mode = saved ?? (prefersDark() ? "dark" : "light");
      setMode(initial);
      applyTheme(initial);
    } catch {
      const initial: Mode = prefersDark() ? "dark" : "light";
      setMode(initial);
      applyTheme(initial);
    }
  }, []);

  // Apply on change
  React.useEffect(() => {
    if (!mounted) return;
    applyTheme(mode);
  }, [mode, mounted]);

  // Render a clear, labeled segmented control: “Mode: Light / Dark”
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--muted)]">Mode:</span>

      <div
        role="group"
        aria-label="Theme mode"
        className="inline-flex overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"
      >
        <button
          type="button"
          aria-pressed={mode === "light"}
          onClick={() => setMode("light")}
          className={[
            "px-3 py-1.5 text-xs transition-colors",
            mode === "light"
              ? "bg-[var(--accent)] text-black"
              : "text-[var(--muted)] hover:text-[var(--text)]",
          ].join(" ")}
        >
          ☀︎ Light
        </button>

        <button
          type="button"
          aria-pressed={mode === "dark"}
          onClick={() => setMode("dark")}
          className={[
            "px-3 py-1.5 text-xs border-l border-[var(--border)] transition-colors",
            mode === "dark"
              ? "bg-[var(--accent)] text-black"
              : "text-[var(--muted)] hover:text-[var(--text)]",
          ].join(" ")}
        >
          ● Dark
        </button>
      </div>
    </div>
  );
}

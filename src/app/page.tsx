// src/app/(marketing)/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* Local CSS for subtle hero + features animations */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          /* Hero */
          @keyframes heroRiseIn {
            0% { opacity: 0; transform: translateY(12px) scale(0.985); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes heroFadeUp {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes heroUnderlineGrow {
            0% { width: 0; opacity: .35; }
            100% { width: 6rem; opacity: 1; }
          }
          .hero-title { animation: heroRiseIn .70s cubic-bezier(.22,.9,.31,1) both; }
          .hero-sub   { animation: heroFadeUp .80s ease-out .08s both; }
          .hero-cta   { animation: heroFadeUp .80s ease-out .16s both; }
          .hero-underline { animation: heroUnderlineGrow .90s cubic-bezier(.22,.9,.31,1) .12s both; }

          /* Features grid */
          @keyframes featFadeUp {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes featIconIn {
            0% { opacity: 0; transform: scale(.85) rotate(-3deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          #features .feat { animation: featFadeUp .60s ease-out both; }
          #features .feat:hover { transform: translateY(-2px); transition: transform .18s ease; }
          #features .feat .feat-icon { animation: featIconIn .45s cubic-bezier(.22,.9,.31,1) both; }
          /* Stagger the six cards */
          #features .feat:nth-child(1) { animation-delay: .05s; }
          #features .feat:nth-child(2) { animation-delay: .12s; }
          #features .feat:nth-child(3) { animation-delay: .19s; }
          #features .feat:nth-child(4) { animation-delay: .26s; }
          #features .feat:nth-child(5) { animation-delay: .33s; }
          #features .feat:nth-child(6) { animation-delay: .40s; }
          /* Match icon delay slightly after its card */
          #features .feat:nth-child(1) .feat-icon { animation-delay: .10s; }
          #features .feat:nth-child(2) .feat-icon { animation-delay: .17s; }
          #features .feat:nth-child(3) .feat-icon { animation-delay: .24s; }
          #features .feat:nth-child(4) .feat-icon { animation-delay: .31s; }
          #features .feat:nth-child(5) .feat-icon { animation-delay: .38s; }
          #features .feat:nth-child(6) .feat-icon { animation-delay: .45s; }
          /* Icon hover nudge */
          #features .feat:hover .feat-icon { transform: translateY(-2px); transition: transform .18s ease; }
        }
        .hero-cta:hover { transform: translateY(-1px); }
        .hero-cta:active { transform: translateY(0); }
      `}</style>

      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="max-w-4xl">
            <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Better data. Better decisions.
            </h1>
            {/* animated accent underline */}
            <div
              className="hero-underline h-1.5 rounded-full mt-3"
              style={{
                background:
                  "linear-gradient(90deg, var(--accent, #3b82f6), transparent)",
                width: "6rem",
              }}
              aria-hidden="true"
            />
            <p className="hero-sub mt-4 text-[var(--muted)] text-base sm:text-lg leading-relaxed">
              Explore, search, and filter clinical datasets—right in your browser.
              Global search across tables, rich per-table filters, single or stacked
              results views, CSV export, and privacy by design (your data stays on
              your machine).
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link href="/explore" className="btn btn-primary hero-cta">
                Open the Explorer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Results views */}
        <div className="card feat">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="feat-icon rounded-xl border border-[var(--border)] bg-[var(--chip)] p-2 text-[var(--accent)]">
                {/* Light theme icon (default) */}
                <Image
                  src="/icons/results-views-icon.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="block dark:hidden select-none"
                  aria-hidden
                />
                {/* Dark theme icon variant */}
                <Image
                  src="/icons/results-views-icon-light.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="hidden dark:block select-none"
                  aria-hidden
                />
              </div>
              <h3 className="font-semibold">Results views: Single or Stacked</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Toggle between a focused <span className="font-medium">single-table</span> view (tabbed across tables)
              and the classic <span className="font-medium">stacked</span> list that shows all selected tables vertically.
            </p>
          </div>
        </div>

        {/* Global search */}
        <div className="card feat">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="feat-icon rounded-xl border border-[var(--border)] bg-[var(--chip)] p-2 text-[var(--accent)]">
                <Image
                  src="/icons/global-search-icon.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="block dark:hidden select-none"
                  aria-hidden
                />
                <Image
                  src="/icons/global-search-icon-light.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="hidden dark:block select-none"
                  aria-hidden
                />
              </div>
              <h3 className="font-semibold">Global search across tables</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Type once to search across all selected tables. Case-insensitive, fast, and designed for discovery—
              with live match counts to guide you.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card feat">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="feat-icon rounded-xl border border-[var(--border)] bg-[var(--chip)] p-2 text-[var(--accent)]">
                <Image
                  src="/icons/filters-icon.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="block dark:hidden select-none"
                  aria-hidden
                />
                <Image
                  src="/icons/filters-icon-light.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="hidden dark:block select-none"
                  aria-hidden
                />
              </div>
              <h3 className="font-semibold">Rich, dynamic filters</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Pinned fields, enum include/exclude chips, number &amp; date ranges, boolean toggles, and text operators
              (contains/equals/starts/ends). Clear any field, table, or everything with one click.
            </p>
          </div>
        </div>

        {/* Professional tables */}
        <div className="card feat">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="feat-icon rounded-xl border border-[var(--border)] bg-[var(--chip)] p-2 text-[var(--accent)]">
                <Image
                  src="/icons/grid-icon.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="block dark:hidden select-none"
                  aria-hidden
                />
                <Image
                  src="/icons/grid-icon-light.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="hidden dark:block select-none"
                  aria-hidden
                />
              </div>
              <h3 className="font-semibold">Professional data grids</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Virtualized rows for speed, sortable columns, pagination, <span className="font-medium">per-table resizable
              height</span>, and one-click <span className="font-medium">CSV export</span>.
            </p>
          </div>
        </div>

        {/* Privacy & performance */}
        <div className="card feat">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="feat-icon rounded-xl border border-[var(--border)] bg-[var(--chip)] p-2 text-[var(--accent)]">
                <Image
                  src="/icons/private-icon.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="block dark:hidden select-none"
                  aria-hidden
                />
                <Image
                  src="/icons/private-icon-light.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="hidden dark:block select-none"
                  aria-hidden
                />
              </div>
              <h3 className="font-semibold">Private by default</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Everything runs locally in your browser—no servers, no ETL, no data leaving your machine.
            </p>
          </div>
        </div>

        {/* Multi-table schema */}
        <div className="card feat">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="feat-icon rounded-xl border border-[var(--border)] bg-[var(--chip)] p-2 text-[var(--accent)]">
                <Image
                  src="/icons/clinical-datasets-icon.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="block dark:hidden select-none"
                  aria-hidden
                />
                <Image
                  src="/icons/clinical-datasets-icon-light.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="hidden dark:block select-none"
                  aria-hidden
                />
              </div>
              <h3 className="font-semibold">Built for clinical datasets</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Works with <span className="font-medium">Patients</span>, <span className="font-medium">Encounters</span>,
              <span className="font-medium"> Orders</span>, <span className="font-medium">Medications</span>, and
              <span className="font-medium"> Lab&nbsp;Results</span>. See row counts, match totals, and any query errors inline.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

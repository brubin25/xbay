import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Better data. Better decisions.
            </h1>
            <p className="mt-4 text-[var(--muted)] text-base sm:text-lg leading-relaxed">
              Explore, search, and filter clinical datasets—right in your browser.
              Global search across tables, rich per-table filters, single or stacked
              results views, CSV export, and privacy by design (your data stays on
              your machine).
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link href="/explore" className="btn btn-primary">
                Open the Explorer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Results views */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold">Results views: Single or Stacked</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Toggle between a focused <span className="font-medium">single-table</span> view (tabbed across tables)
              and the classic <span className="font-medium">stacked</span> list that shows all selected tables vertically.
            </p>
          </div>
        </div>

        {/* Global search */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold">Global search across tables</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Type once to search across all selected tables. Case-insensitive, fast, and designed for discovery—
              with live match counts to guide you.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold">Rich, dynamic filters</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Pinned fields, enum include/exclude chips, number &amp; date ranges, boolean toggles, and text operators
              (contains/equals/starts/ends). Clear any field, table, or everything with one click.
            </p>
          </div>
        </div>

        {/* Professional tables */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold">Professional data grids</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Virtualized rows for speed, sortable columns, pagination, <span className="font-medium">per-table resizable
              height</span>, and one-click <span className="font-medium">CSV export</span>.
            </p>
          </div>
        </div>

        {/* Privacy & performance */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold">Private by default</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Everything runs locally in your browser—no servers, no ETL, no data leaving your machine.
            </p>
          </div>
        </div>

        {/* Multi-table schema */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold">Built for clinical datasets</h3>
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

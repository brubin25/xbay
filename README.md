# XBay — Explore Clinical Data In-Browser

A Next.js App Router application that lets you **explore clinical datasets entirely in the browser** using **DuckDB-WASM**. It supports **global search across tables**, **rich per-table filters**, two **results layouts (Single/Stacked)**, and **professional data grids** (virtualized rows, sorting, pagination, per-table resizable height, CSV export). **No server or ETL required**—data stays on your machine.

https://xbay-ten.vercel.app/

---

## Features

- **Global search** (case-insensitive) across selected tables with **live match counts**
- **Dynamic filters**: text (contains/equals/starts/ends), enum (include/exclude), number (min/max), date (from/to), boolean (any/true/false)
- **Per-table composition** with removable **filter chips** + clear at **field / table / global** levels
- **Results layouts**: **Single (tabbed)** or **Stacked** (all tables vertically)
- **Professional grids**: virtualized rows, sorting, pagination, **resizable table height** (persisted), **CSV export**
- **Status panel** with row totals and match counts
- **Dark mode** with dark-aware icons
- **Accessible controls** (labels, roles, `aria-*`, keyboard resize)
- **All-client architecture**: runs fully in the browser (COOP/COEP enabled)

---

## Tech Stack

- **Next.js** (App Router, TypeScript)
- **DuckDB-WASM** (browser SQL engine)
- **Zustand** (state management)
- **TanStack Table** + **TanStack Virtual** (grids/virtualization)

---

## Project Structure (high-level)

```
src/
  app/
    (marketing)/page.tsx        # Landing page (animated hero + features)
    explore/page.tsx            # Explorer (data UI)
    layout.tsx                  # Shell, theme bootstrap, header/footer
  components/
    Brand.tsx                   # Logo + subtitle
    DataGrid.tsx                # TanStack Table + Virtualizer + resizable height
    FiltersPro.tsx              # Dynamic filters UI
    GlobalSearch.tsx            # Global search input
    PanelRoot.tsx               # Global panel host
    ResultsLayoutToggle.tsx     # Single/Stacked toggle
    ResultsTabs.tsx             # Tab bar for Single layout
    ThemeToggle.tsx             # Dark/light toggle
  lib/
    duckdb.ts                   # DuckDB-WASM boot + CSV registration
    query.ts                    # runGlobalSearch / getAllMatchCounts helpers
    store.ts                    # Zustand state (selected, term, dynFilters, results…)
  types/
    react-dom.d.ts              # Local type stub for createPortal (build reliability)
public/
  duckdb-dist/                  # DuckDB-WASM assets (wasm/worker)
  data/                         # CSVs (patients.csv, encounters.csv, orders.csv, medications.csv, lab_results.csv)
  icons/                        # Light/dark SVG icons for landing page
  brand/                        # App logo(s)
```

---

## Prerequisites

- **Node.js 18+** (or 20+)
- **npm** / **pnpm** / **yarn**
- A modern browser that supports **COOP/COEP** for SharedArrayBuffer

---

## ⚙️ Local Setup

1. **Clone & install**
   ```bash
   git clone https://github.com/brubin25/xbay.git
   cd xbay
   npm install
   # or: pnpm install / yarn install
   ```

2. **Verify required assets exist**

   - **DuckDB-WASM runtime** (committed to Git):
     ```
     public/duckdb-dist/
       duckdb-eh.wasm
       duckdb-browser-eh.worker.js
       # (plus any other files from the DuckDB-WASM dist you’re using)
     ```

   - **Demo CSVs** (committed to Git):
     ```
     public/data/
       patients.csv
       encounters.csv
       orders.csv
       medications.csv
       lab_results.csv
     ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open **http://localhost:3000** for the landing page and go to **/explore** for the data explorer.

---

## Configuration Notes

### COOP/COEP headers (required for DuckDB-WASM)
Already set in `next.config.ts`:
```ts
export default {
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
};
```

### Type stability for CI (Vercel)
A local type stub avoids CI typing hiccups with `react-dom`:
```
src/types/react-dom.d.ts
```
Ensure `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "typeRoots": ["./src/types", "./node_modules/@types"]
  }
}
```

---

## Deploying to Vercel (Recommended)

1. Push the repo to GitHub.
2. In Vercel, **Import Project** → select the repo.
3. Build settings auto-detect Next.js. No env vars required.
4. Ensure these assets are in Git:
   - `public/duckdb-dist/*` (WASM + worker)
   - `public/data/*.csv`
5. Deploy. COOP/COEP headers from `next.config.ts` apply automatically.

**Common build note:**  
If Vercel logs show _“Could not find a declaration file for module 'react-dom'”_, confirm `src/types/react-dom.d.ts` exists and the `typeRoots` entry is present in `tsconfig.json`.

---

## 🔍 How It Works (High-Level)

- **All-client architecture**: The explorer runs entirely in the browser. DuckDB-WASM loads from `public/duckdb-dist`, CSVs are read with `registerFileBuffer` → `read_csv_auto(...)`.
- **State & data flow**: Zustand tracks `selected`, `term`, `dynFilters`, `results`, `errors`, and **results layout** (Single/Stacked). Effects re-run `runGlobalSearch` / `getAllMatchCounts` on relevant changes.
- **Filter model**: Typed `FilterClause` union (text/enum/number/date/boolean) ensures deterministic query composition; enum values lazy-load and cache per `table.field`. Filter **chips** mirror clauses and support clear at field/table/global levels.
- **Results UX**: **Single** layout uses tabs + prev/next; **Stacked** shows all visible tables. DataGrid is virtualized (TanStack) with sorting, pagination, persisted heights, and one-click CSV export.

---

## 🧪 Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # start prod server after build
```

---

## Troubleshooting

- **Catalog Error: “Table with name patients does not exist!”**  
  Indicates DuckDB hadn’t finished creating tables when a query ran. Initialization loads CSVs then creates tables; on very slow I/O a first-load race can occur. Hard refresh usually resolves; ensure `public/data/*.csv` exist and are reachable.

- **WASM/Worker 404s**  
  Confirm files in `public/duckdb-dist` are committed and paths in `lib/duckdb.ts` match.

- **Hydration warnings**  
  The app guards browser-only APIs, but if you modify layout/components, avoid SSR usage of `window`, `localStorage`, etc.

---

## License

MIT © 2025 XBay Inc.

// src/lib/duckdb.ts
"use client";

import {
  AsyncDuckDB,
  ConsoleLogger,
  DuckDBDataProtocol, // (kept)
} from "@duckdb/duckdb-wasm";

let _db: AsyncDuckDB | null = null;

// ---- NEW: one-time bootstrap guards ----
let _bootstrapOnce: Promise<void> | null = null;
let _bootstrapped = false;

function log(...a: any[]) {
  console.log("[XBay][duckdb]", ...a);
}

export async function getDB(): Promise<AsyncDuckDB> {
  if (_db) return _db;

  const base = "/duckdb-dist";
  const workerURL = `${base}/duckdb-browser-eh.worker.js`;
  const wasmURL = `${base}/duckdb-eh.wasm`;

  const worker = new Worker(workerURL, { type: "module", name: "duckdb" });
  const db = new AsyncDuckDB(new ConsoleLogger(), worker);
  await db.instantiate(new URL(wasmURL, location.href).toString());

  _db = db;
  return db;
}

/* ---------------- CSV loading ---------------- */

type FileSpec = { name: string; url: string; table: string };
const FILES: FileSpec[] = [
  { name: "patients.csv",    url: "/data/patients.csv",    table: "patients" },
  { name: "encounters.csv",  url: "/data/encounters.csv",  table: "encounters" },
  { name: "orders.csv",      url: "/data/orders.csv",      table: "orders" },
  { name: "medications.csv", url: "/data/medications.csv", table: "medications" },
  { name: "lab_results.csv", url: "/data/lab_results.csv", table: "lab_results" },
];

async function fetchAsBuffer(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch failed ${url} (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}

// Check if a table already exists in the catalog
async function tableExists(conn: any, name: string): Promise<boolean> {
  const res = await conn.query(
    `SELECT 1
     FROM duckdb_tables
     WHERE table_name = '${name}' COLLATE NOCASE
     LIMIT 1`
  );
  return (res.toArray() as any[]).length > 0;
}

/**
 * Ensures the CSV-backed tables are present exactly once.
 * Safe to call multiple times; concurrent callers await the same promise.
 */
export async function registerDefaultCSVs() {
  if (_bootstrapped) return;
  if (_bootstrapOnce) return _bootstrapOnce;

  _bootstrapOnce = (async () => {
    const db = await getDB();
    const conn = await db.connect();
    try {
      // If we already created tables earlier in this session, skip work.
      const already = await tableExists(conn, "patients");
      if (already) {
        _bootstrapped = true;
        log("bootstrap: tables already exist, skipping CSV load");
        return;
      }

      // Register files into DuckDB's VFS
      for (const f of FILES) {
        const buf = await fetchAsBuffer(f.url);
        await db.registerFileBuffer(f.name, buf);
      }

      // Create tables from CSVs (idempotent)
      for (const f of FILES) {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS ${f.table} AS
          SELECT * FROM read_csv_auto('${f.name}', HEADER=TRUE, IGNORE_ERRORS=TRUE, SAMPLE_SIZE=-1);
        `);
      }

      // Sanity check / warm read
      const counts = await conn.query(`
        SELECT 'patients' AS t, COUNT(*) AS n FROM patients
        UNION ALL SELECT 'encounters', COUNT(*) FROM encounters
        UNION ALL SELECT 'orders', COUNT(*) FROM orders
        UNION ALL SELECT 'medications', COUNT(*) FROM medications
        UNION ALL SELECT 'lab_results', COUNT(*) FROM lab_results
      `);
      log("bootstrap rowCounts:", counts.toArray());

      _bootstrapped = true;
    } catch (e) {
      // If bootstrap fails, allow later retry
      _bootstrapOnce = null;
      throw e;
    } finally {
      await conn.close();
    }
  })();

  return _bootstrapOnce;
}

// Internal helper so any read waits for bootstrap
async function ensureBootstrapped() {
  if (_bootstrapped) return;
  await registerDefaultCSVs();
}

export async function getRowCounts(): Promise<Record<string, number>> {
  // ---- ensure tables exist before querying ----
  await ensureBootstrapped();

  const db = await getDB();
  const conn = await db.connect();
  try {
    const res = await conn.query(`
      SELECT 'patients' AS t, COUNT(*) AS n FROM patients
      UNION ALL SELECT 'encounters', COUNT(*) FROM encounters
      UNION ALL SELECT 'orders', COUNT(*) FROM orders
      UNION ALL SELECT 'medications', COUNT(*) FROM medications
      UNION ALL SELECT 'lab_results', COUNT(*) FROM lab_results
    `);
    const out: Record<string, number> = {};
    for (const r of res.toArray() as any[]) out[r.t] = Number(r.n);
    return out;
  } finally {
    await conn.close();
  }
}

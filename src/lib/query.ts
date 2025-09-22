// src/lib/query.ts
"use client";

import { getDB } from "./duckdb";
import type { DynFilters, FilterClause, TableName } from "./store";
import type { QueryResult } from "./types"; // keep your existing type

// Re-use your existing helpers:
export async function listColumns(table: string): Promise<string[]> {
  const db = await getDB();
  const conn = await db.connect();
  const res = await conn.query(`PRAGMA table_info('${table}')`);
  await conn.close();
  return (res.toArray() as any[]).map((r) => String(r.name));
}

export async function runHead(table: string, limit = 100): Promise<QueryResult> {
  const db = await getDB();
  const conn = await db.connect();
  const res = await conn.query(`SELECT * FROM ${table} LIMIT ${limit}`);
  const rows = res.toArray();
  const cols = res.schema.fields.map((f: any) => f.name);
  await conn.close();
  return { columns: cols, rows };
}

// ---------- NEW: tiny type helpers ----------
const isDateLike = (t: string) => /(DATE|TIMESTAMP)/i.test(t);
const isNumeric = (t: string) => /(INT|DECIMAL|DOUBLE|FLOAT|REAL|HUGEINT|BIGINT|SMALLINT)/i.test(t);
const isBool = (t: string) => /(BOOL)/i.test(t);

// Column type for a single field
export async function getColumnType(table: string, column: string): Promise<string | null> {
  const db = await getDB();
  const conn = await db.connect();
  try {
    const res = await conn.query(`PRAGMA table_info('${table}')`);
    const row = (res.toArray() as any[]).find((r) => String(r.name) === column);
    return row ? String(row.type) : null;
  } finally {
    await conn.close();
  }
}

// Distinct values (for enum suggestions)
export async function getDistinctValues(
  table: string,
  column: string,
  limit = 25
): Promise<string[]> {
  const db = await getDB();
  const conn = await db.connect();
  try {
    const res = await conn.query(`
      SELECT DISTINCT ${column} AS v
      FROM ${table}
      WHERE ${column} IS NOT NULL
      ORDER BY 1
      LIMIT ${limit}
    `);
    return (res.toArray() as any[]).map((r) => String(r.v ?? ""));
  } finally {
    await conn.close();
  }
}

// ---------- NEW: WHERE builder (term + dynFilters) ----------
function esc(s: string) { return s.replace(/'/g, "''"); }

async function buildWhere(
  table: TableName,
  term?: string,
  dyn?: DynFilters
): Promise<string> {
  const parts: string[] = [];

  // Global term across all columns (your original behavior)
  const t = (term || "").trim();
  if (t) {
    const cols = await listColumns(table);
    const like = esc(t.toLowerCase());
    parts.push(
      "(" +
        cols
          .map((c) => `LOWER(CAST(${c} AS VARCHAR)) LIKE '%${like}%'`)
          .join(" OR ") +
      ")"
    );
  }

  // Dynamic filters
  const tableFilters = (dyn || {})[table];
  if (tableFilters) {
    for (const [field, clause] of Object.entries(tableFilters)) {
      if (!clause) continue;
      switch (clause.kind) {
        case "text": {
          if (!clause.value?.trim()) break;
          const v = esc(clause.value.trim().toLowerCase());
          const wrap = (s: string) => `'${s}'`;
          if (clause.op === "equals") parts.push(`LOWER(CAST(${field} AS VARCHAR)) = ${wrap(v)}`);
          else if (clause.op === "starts") parts.push(`LOWER(CAST(${field} AS VARCHAR)) LIKE ${wrap(v + "%")}`);
          else if (clause.op === "ends") parts.push(`LOWER(CAST(${field} AS VARCHAR)) LIKE ${wrap("%" + v)}`);
          else parts.push(`LOWER(CAST(${field} AS VARCHAR)) LIKE ${wrap("%" + v + "%")}`);
          break;
        }
        case "enum": {
          if (!clause.values?.length) break;
          const list = clause.values.map((x) => `'${esc(x)}'`).join(",");
          if (clause.mode === "exclude") parts.push(`${field} NOT IN (${list})`);
          else parts.push(`${field} IN (${list})`);
          break;
        }
        case "number": {
          const conds: string[] = [];
          if (clause.min !== undefined) conds.push(`TRY_CAST(${field} AS DOUBLE) >= ${clause.min}`);
          if (clause.max !== undefined) conds.push(`TRY_CAST(${field} AS DOUBLE) <= ${clause.max}`);
          if (conds.length) parts.push(conds.join(" AND "));
          break;
        }
        case "date": {
          const conds: string[] = [];
          if (clause.from) conds.push(`TRY_CAST(${field} AS TIMESTAMP) >= TIMESTAMP '${esc(clause.from)}'`);
          if (clause.to)   conds.push(`TRY_CAST(${field} AS TIMESTAMP) <= TIMESTAMP '${esc(clause.to)}'`);
          if (conds.length) parts.push(conds.join(" AND "));
          break;
        }
        case "boolean": {
          if (clause.value === true) parts.push(`${field} = TRUE`);
          else if (clause.value === false) parts.push(`${field} = FALSE`);
          break;
        }
      }
    }
  }

  return parts.length ? `WHERE ${parts.join(" AND ")}` : "";
}

// ---------- UPDATED: search (now optionally filtered) ----------
export async function runGlobalSearch(
  table: string,
  term: string,
  dynFilters?: DynFilters,
  limit = 1000
): Promise<QueryResult> {
  // If no filters passed, keep original code-path for full backward-compat
  const hasFilters = dynFilters && Object.keys(dynFilters).length > 0;

  const db = await getDB();
  const conn = await db.connect();

  let res;
  if (!hasFilters && !term?.trim()) {
    res = await conn.query(`SELECT * FROM ${table} LIMIT ${limit}`);
  } else {
    const where = await buildWhere(table as TableName, term, dynFilters);
    res = await conn.query(`SELECT * FROM ${table} ${where} LIMIT ${limit}`);
  }

  const rows = res.toArray();
  const colsOut = res.schema.fields.map((f: any) => f.name);
  await conn.close();
  return { columns: colsOut, rows };
}

// ---------- NEW: counts for Status (totals or matches) ----------
export async function getAllMatchCounts(
  term: string,
  dynFilters?: DynFilters
): Promise<Record<string, number>> {
  const tables: TableName[] = ["patients","encounters","orders","medications","lab_results"];
  const db = await getDB();
  const conn = await db.connect();
  const out: Record<string, number> = {};

  try {
    for (const t of tables) {
      const where = await buildWhere(t, term, dynFilters);
      const q = await conn.query(`SELECT COUNT(*) AS n FROM ${t} ${where}`);
      out[t] = Number((q.toArray() as any[])[0]?.n ?? 0);
    }
  } finally {
    await conn.close();
  }
  return out;
}

// scripts/copy-duckdb-assets.mjs
import { promises as fs } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "node_modules/@duckdb/duckdb-wasm/dist");
const out = resolve(root, "public/duckdb");

async function ensureDir(p) { try { await fs.mkdir(p, { recursive: true }); } catch {} }

async function pickFile(dir, pattern) {
  const files = await fs.readdir(dir);
  // pick the first that matches the pattern
  const f = files.find((x) => pattern.test(x));
  if (!f) throw new Error(`DuckDB asset not found matching: ${pattern}`);
  return resolve(dir, f);
}

async function main() {
  await ensureDir(out);

  // match either EH or MVP variants (or future names that still match these patterns)
  const wasmSrc   = await pickFile(dist, /^duckdb-.*\.wasm$/);
  const workerSrc = await pickFile(dist, /^duckdb-browser-.*\.worker\.js$/);

  // copy to canonical names so our app code is stable
  await fs.copyFile(wasmSrc,   resolve(out, "duckdb.wasm"));
  await fs.copyFile(workerSrc, resolve(out, "duckdb.worker.js"));

  console.log("Copied:");
  console.log("  wasm  -> /public/duckdb/duckdb.wasm");
  console.log("  worker-> /public/duckdb/duckdb.worker.js");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
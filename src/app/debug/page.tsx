// src/app/debug/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getDB, registerDefaultCSVs, getRowCounts } from "@/lib/duckdb";
import { runHead } from "@/lib/query";

export default function DebugPage() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [sample, setSample] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState("starting");

  useEffect(() => {
    (async () => {
      try {
        setStep("getDB");
        await getDB();

        setStep("register CSVs");
        await registerDefaultCSVs();

        setStep("counts");
        const c = await getRowCounts();
        setCounts(c);

        setStep("sample head");
        const head = await runHead("patients", 5);
        setSample(head.rows);

        setStep("done");
      } catch (e: any) {
        setErr(String(e?.message ?? e));
        console.error("[debug] error at step", step, e);
      }
    })();
  }, [step]);

  return (
    <main style={{ padding: 20, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>XBay Debug</h1>
      <p>Step: <strong>{step}</strong></p>
      {err && <p style={{ color: "crimson" }}><strong>Error:</strong> {err}</p>}

      <h2 style={{ marginTop: 16, fontWeight: 600 }}>Row counts</h2>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(counts, null, 2)}
      </pre>

      <h2 style={{ marginTop: 16, fontWeight: 600 }}>Sample patients rows</h2>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(sample, null, 2)}
      </pre>
    </main>
  );
}

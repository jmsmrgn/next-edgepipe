"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { PipelineViz } from "./_components/PipelineViz";
import type { LogEntry } from "./_components/RequestLog";

const ResultsPanel = dynamic(() =>
  import("./_components/ResultsPanel").then((m) => ({ default: m.ResultsPanel }))
);
const RequestLog = dynamic(() =>
  import("./_components/RequestLog").then((m) => ({ default: m.RequestLog }))
);

interface TraceResult {
  requestId: string;
  timestamp: string;
  middlewarePipeline: { name: string; status: string }[];
  geo: { country: string };
  rateLimit: { limit: string | null; remaining: string | null; reset: string | null };
  client: { ip: string };
  durationMs: number;
}

async function fetchTrace(): Promise<{ result: TraceResult; status: number; durationMs: number }> {
  const t0 = Date.now();
  const res = await fetch("/api/pipeline-trace");
  const durationMs = Date.now() - t0;
  const result = await res.json();
  return { result: { ...result, durationMs }, status: res.status, durationMs };
}

export default function Page() {
  const [latest, setLatest] = useState<TraceResult | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function appendLog(status: number, durationMs: number, timestamp: string) {
    setLog((prev) => [
      { n: prev.length + 1, timestamp, status, durationMs },
      ...prev,
    ]);
  }

  function runOnce() {
    setError(null);
    startTransition(async () => {
      try {
        const { result, status, durationMs } = await fetchTrace();
        setLatest(result);
        appendLog(status, durationMs, result.timestamp);
      } catch {
        setError("Request failed. Check your connection and try again.");
      }
    });
  }

  function stressTest() {
    setError(null);
    startTransition(async () => {
      try {
        for (let i = 0; i < 15; i++) {
          const { result, status, durationMs } = await fetchTrace();
          setLatest(result);
          appendLog(status, durationMs, result.timestamp);
          if (i < 14) await new Promise((r) => setTimeout(r, 50));
        }
      } catch {
        setError("Stress test failed. Some requests may not have completed.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">

        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="font-mono text-3xl font-bold tracking-tight text-white">
              next-edgepipe
            </h1>
            <a
              href="#"
              className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
              GitHub →
            </a>
          </div>
          <p className="text-zinc-400 text-sm">Composable Edge Middleware for Next.js</p>
        </header>

        {/* Pipeline */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Middleware Pipeline
          </h2>
          <PipelineViz />
        </section>

        {/* Controls */}
        <section className="flex gap-3">
          <button
            onClick={runOnce}
            disabled={isPending}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
          >
            {isPending ? "Running…" : "Run Pipeline"}
          </button>
          <button
            onClick={stressTest}
            disabled={isPending}
            className="rounded border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-40 transition-colors"
          >
            Stress Test (15 requests)
          </button>
        </section>

        {/* Error */}
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : null}

        {/* Results */}
        {latest ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Last Response
            </h2>
            <ResultsPanel result={latest} />
          </section>
        ) : null}

        {/* Log */}
        {log.length > 0 ? <RequestLog entries={log} /> : null}

      </div>
    </div>
  );
}

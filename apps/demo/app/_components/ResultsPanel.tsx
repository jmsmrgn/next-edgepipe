interface TraceResult {
  requestId: string;
  timestamp: string;
  middlewarePipeline: { name: string; status: string }[];
  geo: { country: string };
  rateLimit: { limit: string | null; remaining: string | null; reset: string | null };
  client: { ip: string };
  durationMs: number;
}

export function ResultsPanel({ result }: { result: TraceResult }) {
  const limit = Number(result.rateLimit.limit ?? 10);
  const remaining = Number(result.rateLimit.remaining ?? limit);
  const pct = Math.max(0, (remaining / limit) * 100);
  const depleted = remaining === 0;

  return (
    <div className="rounded border border-zinc-700 bg-zinc-900 p-4 space-y-4">
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
        <Kv label="Request ID" value={result.requestId.slice(0, 8) + "…"} />
        <Kv label="Timestamp" value={new Date(result.timestamp).toLocaleTimeString()} />
        <Kv label="Country" value={result.geo.country} />
        <Kv label="Client IP" value={result.client.ip} />
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>Rate limit</span>
          <span className={depleted ? "text-red-400" : "text-zinc-400"}>
            {remaining}/{limit} remaining
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-800">
          <div
            className={`h-2 rounded-full transition-all ${depleted ? "bg-red-500" : "bg-emerald-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {result.middlewarePipeline.map((m) => (
          <div key={m.name} className="flex items-center gap-2 text-sm">
            <span className="text-emerald-400">✓</span>
            <span className="font-mono text-zinc-300">{m.name}</span>
            <span className="text-zinc-600 text-xs">{m.status}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        Response time: <span className="text-zinc-300">{result.durationMs}ms</span>
      </p>
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-mono text-sm text-zinc-200 truncate">{value}</p>
    </div>
  );
}

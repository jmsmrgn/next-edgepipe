export interface LogEntry {
  n: number;
  timestamp: string;
  status: number;
  durationMs: number;
}

export function RequestLog({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Request Log
      </h2>
      <div className="max-h-48 overflow-y-auto rounded border border-zinc-800 font-mono text-xs">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="px-3 py-1.5 text-left">#</th>
              <th className="px-3 py-1.5 text-left">Time</th>
              <th className="px-3 py-1.5 text-left">Status</th>
              <th className="px-3 py-1.5 text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.n} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-3 py-1.5 text-zinc-500">{e.n}</td>
                <td className="px-3 py-1.5 text-zinc-400">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                      e.status === 200
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    {e.status}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right text-zinc-400">{e.durationMs}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

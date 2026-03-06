const steps = [
  { name: "withLogging", desc: "Records timing & geo per request" },
  { name: "withGeoBlock", desc: "Blocks CN, RU, KP by country" },
  { name: "withRateLimit", desc: "10 req/min per IP, in-memory" },
  { name: "withAuth", desc: "Cookie token, public path bypass" },
];

export function PipelineViz() {
  return (
    <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={step.name} className="flex items-center">
          <div className="rounded border border-zinc-700 bg-zinc-900 px-4 py-3 min-w-[150px]">
            <p className="font-mono text-sm font-semibold text-emerald-400">{step.name}</p>
            <p className="mt-1 text-xs text-zinc-500 leading-snug">{step.desc}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center px-1 text-zinc-600 select-none">
              <span className="text-lg">→</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

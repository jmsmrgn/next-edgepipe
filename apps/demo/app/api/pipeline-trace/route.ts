import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
  const h = (name: string) => req.headers.get(name);

  return NextResponse.json({
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    middlewarePipeline: [
      { name: "withLogging", status: "executed" },
      { name: "withGeoBlock", status: "executed" },
      { name: "withRateLimit", status: "executed" },
      { name: "withAuth", status: "executed" },
    ],
    geo: {
      country: h("x-edgepipe-country") ?? "unknown",
    },
    rateLimit: {
      limit: h("x-ratelimit-limit"),
      remaining: h("x-ratelimit-remaining"),
      reset: h("x-ratelimit-reset"),
    },
    client: {
      ip: h("x-forwarded-for") ?? "unknown",
    },
  });
}

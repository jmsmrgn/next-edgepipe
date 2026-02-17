import type { NextRequest } from "next/server";
import type { EdgePipeContext, EdgePipeMiddleware, LogEntry } from "../types.js";

export interface WithLoggingOptions {
  logger?: (entry: LogEntry) => void;
  include?: Array<"headers" | "geo" | "timing">;
}

export function withLogging(options?: WithLoggingOptions): EdgePipeMiddleware<EdgePipeContext> {
  const logger = options?.logger ?? ((entry) => console.log(JSON.stringify(entry)));
  const include = options?.include ?? [];

  return async (req, ctx, next) => {
    const response = await next();
    const durationMs = Date.now() - ctx.startTime;

    const entry: LogEntry = {
      requestId: ctx.requestId,
      method: ctx.method,
      path: ctx.path,
      status: response.status,
      durationMs,
      timestamp: new Date().toISOString(),
    };

    if (include.includes("headers")) {
      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        headers[key] = value;
      });
      entry.headers = headers;
    }

    if (include.includes("geo")) {
      entry.geo = req.headers.get("x-vercel-ip-country");
    }

    logger(entry);
    return response;
  };
}

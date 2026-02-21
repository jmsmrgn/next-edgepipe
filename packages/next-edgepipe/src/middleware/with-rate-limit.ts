import { NextRequest, NextResponse } from "next/server";
import type { RateLimitAdapter } from "../adapters/types.js";
import type { EdgePipeContext, EdgePipeMiddleware } from "../types.js";

export interface WithRateLimitOptions {
  adapter: RateLimitAdapter;
  limit: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest, ctx: EdgePipeContext) => string;
  onLimited?: (
    req: NextRequest,
    ctx: EdgePipeContext,
    info: { count: number; reset: number }
  ) => Promise<NextResponse>;
  addHeaders?: boolean;
}

function defaultKeyGenerator(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export function withRateLimit(
  options: WithRateLimitOptions
): EdgePipeMiddleware<EdgePipeContext> {
  const {
    adapter,
    limit,
    windowMs,
    keyGenerator = defaultKeyGenerator,
    onLimited,
    addHeaders = true,
  } = options;

  return async (req, ctx, next) => {
    const key = keyGenerator(req, ctx);
    const { count, reset } = await adapter.increment(key, windowMs);
    const remaining = Math.max(0, limit - count);
    const limited = count > limit;

    ctx.rateLimit = { limited, count, remaining };

    if (limited) {
      if (onLimited) {
        return onLimited(req, ctx, { count, reset });
      }
      return NextResponse.json(
        { error: "Rate limit exceeded", reset },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const response = await next();

    if (addHeaders) {
      response.headers.set("X-RateLimit-Limit", String(limit));
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      response.headers.set("X-RateLimit-Reset", String(reset));
    }

    return response;
  };
}

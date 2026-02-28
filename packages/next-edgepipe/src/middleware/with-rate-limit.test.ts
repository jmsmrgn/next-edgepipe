import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "./with-rate-limit.js";
import { MemoryRateLimitAdapter } from "../adapters/rate-limit/memory-rate-limit-adapter.js";
import { createContext } from "../context.js";

// Each test uses a unique IP to avoid shared state in MemoryRateLimitAdapter
let ipCounter = 0;
function makeReq(ip?: string) {
  const headers: Record<string, string> = {};
  if (ip) headers["x-forwarded-for"] = ip;
  return new NextRequest(
    new Request("https://localhost/test", { method: "GET", headers })
  );
}
function uniqueIp() {
  return `10.0.0.${++ipCounter}`;
}

function makeNext() {
  return vi.fn(async () => NextResponse.next());
}

describe("withRateLimit", () => {
  it("calls next() when under limit", async () => {
    const ip = uniqueIp();
    const req = makeReq(ip);
    const ctx = createContext(req);
    const next = makeNext();

    await withRateLimit({
      adapter: new MemoryRateLimitAdapter(),
      limit: 10,
      windowMs: 60_000,
    })(req, ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 429 when limit is exceeded", async () => {
    const ip = uniqueIp();
    const adapter = new MemoryRateLimitAdapter();
    const opts = { adapter, limit: 2, windowMs: 60_000 };

    // Exhaust the limit
    for (let i = 0; i < 2; i++) {
      const req = makeReq(ip);
      const ctx = createContext(req);
      await withRateLimit(opts)(req, ctx, makeNext());
    }

    // This one exceeds
    const req = makeReq(ip);
    const ctx = createContext(req);
    const res = await withRateLimit(opts)(req, ctx, makeNext());

    expect(res.status).toBe(429);
  });

  it("adds X-RateLimit-* headers when addHeaders is true", async () => {
    const ip = uniqueIp();
    const req = makeReq(ip);
    const ctx = createContext(req);
    const next = makeNext();

    const res = await withRateLimit({
      adapter: new MemoryRateLimitAdapter(),
      limit: 10,
      windowMs: 60_000,
      addHeaders: true,
    })(req, ctx, next);

    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).not.toBeNull();
    expect(res.headers.get("X-RateLimit-Reset")).not.toBeNull();
  });

  it("omits X-RateLimit-* headers when addHeaders is false", async () => {
    const ip = uniqueIp();
    const req = makeReq(ip);
    const ctx = createContext(req);
    const next = makeNext();

    const res = await withRateLimit({
      adapter: new MemoryRateLimitAdapter(),
      limit: 10,
      windowMs: 60_000,
      addHeaders: false,
    })(req, ctx, next);

    expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
  });

  it("populates ctx.rateLimit correctly", async () => {
    const ip = uniqueIp();
    const req = makeReq(ip);
    const ctx = createContext(req);
    const next = makeNext();

    await withRateLimit({
      adapter: new MemoryRateLimitAdapter(),
      limit: 10,
      windowMs: 60_000,
    })(req, ctx, next);

    expect(ctx.rateLimit).toMatchObject({
      limited: false,
      count: 1,
      remaining: 9,
    });
  });

  it("uses custom keyGenerator when provided", async () => {
    const keyGenerator = vi.fn(() => "custom-key-" + uniqueIp());
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    await withRateLimit({
      adapter: new MemoryRateLimitAdapter(),
      limit: 10,
      windowMs: 60_000,
      keyGenerator,
    })(req, ctx, next);

    expect(keyGenerator).toHaveBeenCalledOnce();
    expect(keyGenerator).toHaveBeenCalledWith(req, ctx);
  });

  it("calls onLimited override when limit exceeded", async () => {
    const ip = uniqueIp();
    const adapter = new MemoryRateLimitAdapter();
    const onLimited = vi.fn(async () =>
      NextResponse.json({ error: "custom limit" }, { status: 429 })
    );
    const opts = { adapter, limit: 1, windowMs: 60_000, onLimited };

    // First request — within limit
    const req1 = makeReq(ip);
    await withRateLimit(opts)(req1, createContext(req1), makeNext());

    // Second request — exceeds limit
    const req2 = makeReq(ip);
    const res = await withRateLimit(opts)(req2, createContext(req2), makeNext());

    expect(onLimited).toHaveBeenCalledOnce();
    expect(res.status).toBe(429);
  });
});

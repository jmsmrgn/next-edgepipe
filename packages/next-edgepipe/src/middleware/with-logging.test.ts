import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withLogging } from "./with-logging.js";
import { createContext } from "../context.js";
import type { LogEntry } from "../types.js";

function makeReq(path = "/test") {
  return new NextRequest(new Request(`https://localhost${path}`, { method: "GET" }));
}

describe("withLogging", () => {
  it("calls logger after request completes", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const logger = vi.fn();
    const next = async () => NextResponse.next();

    await withLogging({ logger })(req, ctx, next);

    expect(logger).toHaveBeenCalledOnce();
  });

  it("durationMs is a positive number", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    let captured: LogEntry | undefined;
    const logger = (entry: LogEntry) => { captured = entry; };
    const next = async () => NextResponse.next();

    await withLogging({ logger })(req, ctx, next);

    expect(captured?.durationMs).toBeGreaterThanOrEqual(0);
    expect(typeof captured?.durationMs).toBe("number");
  });

  it("requestId in log entry matches ctx.requestId", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    let captured: LogEntry | undefined;
    const logger = (entry: LogEntry) => { captured = entry; };
    const next = async () => NextResponse.next();

    await withLogging({ logger })(req, ctx, next);

    expect(captured?.requestId).toBe(ctx.requestId);
  });

  it("status code in log entry matches response status", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    let captured: LogEntry | undefined;
    const logger = (entry: LogEntry) => { captured = entry; };
    const next = async () => new NextResponse(null, { status: 204 });

    await withLogging({ logger })(req, ctx, next);

    expect(captured?.status).toBe(204);
  });
});

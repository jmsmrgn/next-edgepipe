import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withGeoBlock } from "./with-geo-block.js";
import { MockGeoAdapter } from "../adapters/geo/mock-geo-adapter.js";
import { createContext } from "../context.js";

function makeReq(path = "/test") {
  return new NextRequest(new Request(`https://localhost${path}`, { method: "GET" }));
}

function makeNext() {
  return vi.fn(async () => NextResponse.next());
}

describe("withGeoBlock", () => {
  it("returns 403 for blocked country", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    const res = await withGeoBlock({
      adapter: new MockGeoAdapter("RU"),
      blockedCountries: ["RU", "CN"],
    })(req, ctx, next);

    expect(res.status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() for non-blocked country", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    await withGeoBlock({
      adapter: new MockGeoAdapter("US"),
      blockedCountries: ["RU", "CN"],
    })(req, ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allowedCountries: blocks country not in the list", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    const res = await withGeoBlock({
      adapter: new MockGeoAdapter("DE"),
      allowedCountries: ["US", "CA"],
    })(req, ctx, next);

    expect(res.status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allowedCountries: allows country in the list", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    await withGeoBlock({
      adapter: new MockGeoAdapter("US"),
      allowedCountries: ["US", "CA"],
    })(req, ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("calls onBlocked override when provided", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();
    const onBlocked = vi.fn(async () =>
      NextResponse.json({ error: "custom block" }, { status: 451 })
    );

    const res = await withGeoBlock({
      adapter: new MockGeoAdapter("CN"),
      blockedCountries: ["CN"],
      onBlocked,
    })(req, ctx, next);

    expect(onBlocked).toHaveBeenCalledOnce();
    expect(res.status).toBe(451);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets ctx.geo correctly when blocked", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    await withGeoBlock({
      adapter: new MockGeoAdapter("RU"),
      blockedCountries: ["RU"],
    })(req, ctx, next);

    expect(ctx.geo).toEqual({ country: "RU", blocked: true });
  });

  it("sets ctx.geo correctly when not blocked", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    await withGeoBlock({
      adapter: new MockGeoAdapter("US"),
      blockedCountries: ["RU"],
    })(req, ctx, next);

    expect(ctx.geo).toEqual({ country: "US", blocked: false });
  });

  it("adds x-edgepipe-country header when addCountryHeader is true", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    const res = await withGeoBlock({
      adapter: new MockGeoAdapter("US"),
      blockedCountries: [],
      addCountryHeader: true,
    })(req, ctx, next);

    expect(res.headers.get("x-edgepipe-country")).toBe("US");
  });

  it("omits x-edgepipe-country header when addCountryHeader is false", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    const res = await withGeoBlock({
      adapter: new MockGeoAdapter("US"),
      blockedCountries: [],
      addCountryHeader: false,
    })(req, ctx, next);

    expect(res.headers.get("x-edgepipe-country")).toBeNull();
  });
});

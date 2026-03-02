import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "./with-auth.js";
import { createContext } from "../context.js";

function makeReq(path = "/protected") {
  return new NextRequest(new Request(`https://localhost${path}`, { method: "GET" }));
}

function makeNext() {
  return vi.fn(async () => NextResponse.next());
}

describe("withAuth", () => {
  it("calls next() when token is present", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    await withAuth({ getToken: () => "valid-token" })(req, ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("redirects to redirectTo when token is null", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    const res = await withAuth({ getToken: () => null, redirectTo: "/sign-in" })(
      req, ctx, next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/sign-in");
  });

  it("defaults redirectTo to /login", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    const res = await withAuth({ getToken: () => null })(req, ctx, next);

    expect(res.headers.get("location")).toContain("/login");
  });

  it("bypasses auth for paths in publicPaths", async () => {
    const req = makeReq("/public/page");
    const ctx = createContext(req);
    const next = makeNext();

    await withAuth({ getToken: () => null, publicPaths: ["/public"] })(req, ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("calls onUnauthorized when provided and token is null", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();
    const onUnauthorized = vi.fn(async () =>
      NextResponse.json({ error: "nope" }, { status: 401 })
    );

    const res = await withAuth({ getToken: () => null, onUnauthorized })(req, ctx, next);

    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets ctx.auth correctly when authenticated", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    await withAuth({ getToken: () => "token" })(req, ctx, next);

    expect(ctx.auth).toEqual({ authenticated: true, tokenPresent: true });
  });

  it("sets ctx.auth correctly when unauthenticated", async () => {
    const req = makeReq();
    const ctx = createContext(req);
    const next = makeNext();

    await withAuth({ getToken: () => null })(req, ctx, next);

    expect(ctx.auth).toEqual({ authenticated: false, tokenPresent: false });
  });
});

import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { pipe } from "./pipe.js";
import type { EdgePipeContext, EdgePipeMiddleware } from "./types.js";

function makeReq(path = "/test") {
  return new NextRequest(new Request(`https://localhost${path}`, { method: "GET" }));
}

describe("pipe", () => {
  it("executes middleware in declared order", async () => {
    const order: number[] = [];

    const m1: EdgePipeMiddleware<EdgePipeContext> = async (req, ctx, next) => {
      order.push(1);
      return next();
    };
    const m2: EdgePipeMiddleware<EdgePipeContext> = async (req, ctx, next) => {
      order.push(2);
      return next();
    };
    const m3: EdgePipeMiddleware<EdgePipeContext> = async (req, ctx, next) => {
      order.push(3);
      return next();
    };

    await pipe([m1, m2, m3])(makeReq());
    expect(order).toEqual([1, 2, 3]);
  });

  it("context mutations are visible to subsequent middleware", async () => {
    let seenValue: unknown;

    const m1: EdgePipeMiddleware<EdgePipeContext> = async (req, ctx, next) => {
      ctx.custom = "hello";
      return next();
    };
    const m2: EdgePipeMiddleware<EdgePipeContext> = async (req, ctx, next) => {
      seenValue = ctx.custom;
      return next();
    };

    await pipe([m1, m2])(makeReq());
    expect(seenValue).toBe("hello");
  });

  it("returning a response early short-circuits the chain", async () => {
    const m2 = vi.fn(async (_req: NextRequest, _ctx: EdgePipeContext, next: () => Promise<NextResponse>) => next());

    const m1: EdgePipeMiddleware<EdgePipeContext> = async () => {
      return NextResponse.json({ blocked: true }, { status: 403 });
    };

    const res = await pipe([m1, m2])(makeReq());
    expect(res.status).toBe(403);
    expect(m2).not.toHaveBeenCalled();
  });

  it("calls onError when middleware throws", async () => {
    const onError = vi.fn(async () =>
      NextResponse.json({ error: "custom error" }, { status: 503 })
    );

    const throwing: EdgePipeMiddleware<EdgePipeContext> = async () => {
      throw new Error("boom");
    };

    const res = await pipe([throwing], { onError })(makeReq());
    expect(onError).toHaveBeenCalledOnce();
    expect(res.status).toBe(503);
  });

  it("returns 500 when middleware throws and no onError provided", async () => {
    const throwing: EdgePipeMiddleware<EdgePipeContext> = async () => {
      throw new Error("boom");
    };

    const res = await pipe([throwing])(makeReq());
    expect(res.status).toBe(500);
  });

  it("returned function is assignable as Next.js middleware handler", () => {
    // Type-level assertion: pipe() must return (req: NextRequest) => Promise<NextResponse>
    const handler: (req: NextRequest) => Promise<NextResponse> = pipe([]);
    expect(typeof handler).toBe("function");
  });
});

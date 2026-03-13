# next-edgepipe
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

Composable Edge Middleware for Next.js.

> **Design philosophy:** Every decision has a specific justification, not a preference. The adapter pattern exists for testability. ESM-only exists for runtime correctness. Mutable context exists so middleware layers can communicate downstream without touching the request. See Architecture Decisions.

## Installation

```bash
pnpm add next-edgepipe
# npm install next-edgepipe
# yarn add next-edgepipe
```

> Not yet published to npm — clone the repo and run the demo locally for now. Publishing planned after broader testing.

## Live Demo

[next-edgepipe.vercel.app](https://next-edgepipe.vercel.app) — hit "Stress Test" to see rate limiting trigger 429s in real time.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jmsmrgn/next-edgepipe)

## The Problem

Next.js gives you exactly one `middleware.ts` file with no composition primitive. There is no built-in way to split logic across modules, share state between layers, or sequence operations with early-exit semantics. The file is a single async function — full stop.

Enterprise applications need authentication, rate limiting, geo-blocking, and structured logging applied consistently across every route. The only options today are manual `if/else` chains that grow without bound, or importing multiple libraries that each instrument the request independently with no shared context, no consistent error handling, and no visibility into what ran before or after them.

This is not a niche complaint. Vercel's own Next.js repository has multiple open GitHub Discussions on this exact issue — #53997, #63234, #73116, #74765 — each with dozens of comments and no official resolution. The community workaround is a copy-paste `chainMiddleware()` helper function that circulates through blog posts, untyped, with no shared context and no adapter pattern. `next-edgepipe` is the first attempt to package a proper solution.

## The Solution

```ts
// apps/demo/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { pipe, withLogging, withGeoBlock, withRateLimit, withAuth } from "next-edgepipe";
import { VercelGeoAdapter, MemoryRateLimitAdapter } from "next-edgepipe";

const middleware: (req: NextRequest) => Promise<NextResponse> = pipe([
  withLogging({ include: ["timing", "geo"] }),
  withGeoBlock({
    adapter: new VercelGeoAdapter(),
    blockedCountries: ["CN", "RU", "KP"],
    addCountryHeader: true,
  }),
  withRateLimit({
    adapter: new MemoryRateLimitAdapter(),
    limit: 10,
    windowMs: 60000,
    addHeaders: true,
  }),
  withAuth({
    getToken: (req) => req.cookies.get("demo-token")?.value ?? null,
    redirectTo: "/login",
    publicPaths: ["/", "/api/pipeline-trace", "/login"],
  }),
]);

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

## Prior Art

The community `chainMiddleware` helper — documented in blog posts by 58bits, reacthustle, and others — solves basic sequencing. It does not provide typed shared context, has no adapter interfaces, and ships as copy-paste code rather than a versioned dependency.

`@nimpl/proxy-chain` solves a different problem: composing *existing* third-party middleware packages that have incompatible APIs. It is not designed for building your own pipeline with typed context propagation and injectable infrastructure adapters.

Neither addresses the core gap: a typed, testable, adapter-based composition primitive for middleware you write yourself.

## Architecture Decisions

### Why `pipe()` not `compose()` or `chain()`

`pipe` is the correct term for this pattern: data flows forward through each function in the order it is written. `compose` implies right-to-left evaluation — the mathematical convention — which is the opposite of execution order and would make the middleware array read backwards relative to what actually runs first. `chain` is ambiguous enough to mean almost anything depending on context. When the name of a function describes its semantics exactly, that accuracy compounds across every codebase that uses the library.

### Why injectable adapters instead of hardcoded Vercel KV / Edge Config

Three reasons. First, teams can swap implementations without touching middleware logic — swapping from `MemoryRateLimitAdapter` to a Redis-backed adapter in production requires changing one constructor call, not rewriting the middleware. Second, unit testing works without real infrastructure: `MockGeoAdapter` and `MemoryRateLimitAdapter` mean zero external dependencies in tests, which is what makes the test suite run in 230ms with no network. Third, the adapter interface documents the integration contract explicitly — `getCountry(req): Promise<string | null>` is a clearer specification than reading the implementation of a Vercel KV call. The production path is one adapter swap, not a rewrite.

### Why ESM only

The Next.js Edge Runtime does not support CommonJS. Shipping a CJS bundle would compile without errors but fail silently at runtime on Vercel. ESM-only is the only honest choice for an edge-first library — the `"format": ["esm"]` constraint in `tsup.config.ts` is a correctness decision, not a preference.

### Why mutable context, immutable request

`NextRequest` is Vercel's boundary object — the library does not own it and should not mutate it. `EdgePipeContext` is the library's object — it is the sanctioned place for middleware layers to communicate state downstream (auth results, geo decisions, rate limit counts). This follows the principle of least surprise for developers coming from Express who expect a mutable request-scoped store, while keeping the pattern clean for Edge Runtime where the request itself is effectively frozen.

## Built-in Middleware

```ts
// Structured request logging. Captures timing, geo, headers.
withLogging(options?: { logger?: (entry: LogEntry) => void; include?: Array<"headers" | "geo" | "timing"> })

// Country-based access control via pluggable GeoAdapter.
withGeoBlock(options: { adapter: GeoAdapter; blockedCountries?: string[]; allowedCountries?: string[]; onBlocked?: ...; addCountryHeader?: boolean })

// Token-bucket rate limiting via pluggable RateLimitAdapter.
withRateLimit(options: { adapter: RateLimitAdapter; limit: number; windowMs: number; keyGenerator?: ...; onLimited?: ...; addHeaders?: boolean })

// Cookie/token authentication with public path bypass.
withAuth(options: { getToken: (req) => string | null; redirectTo?: string; publicPaths?: string[]; onUnauthorized?: ... })
```

## Writing Custom Middleware

```ts
import type { EdgePipeMiddleware, EdgePipeContext } from "next-edgepipe";
import { NextResponse } from "next/server";

export function withRequestId(): EdgePipeMiddleware<EdgePipeContext> {
  return async (req, ctx, next) => {
    ctx.requestId = crypto.randomUUID(); // overwrite with a stable value if needed
    const response = await next();
    response.headers.set("x-request-id", ctx.requestId);
    return response;
  };
}
```

Any function matching `(req, ctx, next) => Promise<NextResponse>` is a valid middleware. Context mutations are visible to all downstream middleware in the same pipeline run.

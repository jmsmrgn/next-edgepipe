import type { NextRequest, NextResponse } from "next/server";

export interface EdgePipeContext {
  requestId: string;
  startTime: number;
  path: string;
  method: string;
  auth?: { authenticated: boolean; tokenPresent: boolean };
  geo?: { country: string | null; blocked: boolean };
  rateLimit?: { limited: boolean; count: number; remaining: number };
  [key: string]: unknown;
}

export interface LogEntry {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
  headers?: Record<string, string>;
  geo?: string | null;
}

export type EdgePipeMiddleware<TContext extends EdgePipeContext> = (
  req: NextRequest,
  ctx: TContext,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

export interface EdgePipeOptions<TContext extends EdgePipeContext> {
  initContext?: (req: NextRequest) => TContext | Promise<TContext>;
  onError?: (
    err: unknown,
    req: NextRequest,
    ctx: TContext
  ) => Promise<NextResponse>;
}

export interface AdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

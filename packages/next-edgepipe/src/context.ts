import type { NextRequest } from "next/server";
import type { EdgePipeContext } from "./types.js";

export function createContext(
  req: NextRequest,
  extensions?: Record<string, unknown>
): EdgePipeContext {
  return {
    requestId: crypto.randomUUID(),
    startTime: Date.now(),
    path: req.nextUrl.pathname,
    method: req.method,
    ...extensions,
  };
}

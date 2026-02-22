import { NextRequest, NextResponse } from "next/server";
import type { EdgePipeContext, EdgePipeMiddleware } from "../types.js";

export interface WithAuthOptions {
  getToken: (req: NextRequest) => string | null | Promise<string | null>;
  redirectTo?: string;
  onUnauthorized?: (req: NextRequest, ctx: EdgePipeContext) => Promise<NextResponse>;
  publicPaths?: string[];
}

export function withAuth(options: WithAuthOptions): EdgePipeMiddleware<EdgePipeContext> {
  const { getToken, redirectTo = "/login", onUnauthorized, publicPaths = [] } = options;

  return async (req, ctx, next) => {
    if (publicPaths.some((prefix) => ctx.path.startsWith(prefix))) {
      return next();
    }

    const token = await getToken(req);

    if (token === null) {
      ctx.auth = { authenticated: false, tokenPresent: false };
      if (onUnauthorized) {
        return onUnauthorized(req, ctx);
      }
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    ctx.auth = { authenticated: true, tokenPresent: true };
    return next();
  };
}

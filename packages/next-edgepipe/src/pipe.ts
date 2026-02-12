import { NextRequest, NextResponse } from "next/server";
import { createContext } from "./context.js";
import type { EdgePipeContext, EdgePipeMiddleware, EdgePipeOptions } from "./types.js";

export function pipe<TContext extends EdgePipeContext>(
  middlewares: EdgePipeMiddleware<TContext>[],
  options?: EdgePipeOptions<TContext>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    let ctx: TContext;

    try {
      ctx = options?.initContext
        ? await options.initContext(req)
        : (createContext(req) as TContext);
    } catch (err) {
      return NextResponse.json({ error: "Internal middleware error" }, { status: 500 });
    }

    const execute = (index: number): (() => Promise<NextResponse>) => {
      if (index >= middlewares.length) {
        return () => Promise.resolve(NextResponse.next());
      }
      return () => middlewares[index](req, ctx, execute(index + 1));
    };

    try {
      return await execute(0)();
    } catch (err) {
      if (options?.onError) {
        return options.onError(err, req, ctx);
      }
      return NextResponse.json({ error: "Internal middleware error" }, { status: 500 });
    }
  };
}

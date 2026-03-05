import { NextRequest, NextResponse } from "next/server";
import {
  pipe,
  withLogging,
  withGeoBlock,
  withRateLimit,
  withAuth,
} from "next-edgepipe";
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
    publicPaths: ["/api/pipeline-trace", "/login"],
  }),
]);

export default middleware;

export const config = {
  // .+ (not .*) excludes the bare root "/" so the home page is publicly served.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).+)"],
};

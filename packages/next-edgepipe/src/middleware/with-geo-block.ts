import { NextRequest, NextResponse } from "next/server";
import type { GeoAdapter } from "../adapters/types.js";
import type { EdgePipeContext, EdgePipeMiddleware } from "../types.js";

export interface WithGeoBlockOptions {
  adapter: GeoAdapter;
  blockedCountries?: string[];
  allowedCountries?: string[];
  onBlocked?: (
    req: NextRequest,
    ctx: EdgePipeContext,
    country: string
  ) => Promise<NextResponse>;
  addCountryHeader?: boolean;
}

export function withGeoBlock(
  options: WithGeoBlockOptions
): EdgePipeMiddleware<EdgePipeContext> {
  const { adapter, blockedCountries, allowedCountries, onBlocked, addCountryHeader = true } =
    options;

  return async (req, ctx, next) => {
    const country = await adapter.getCountry(req);

    const blocked = allowedCountries
      ? !allowedCountries.includes(country ?? "")
      : (blockedCountries?.includes(country ?? "") ?? false);

    ctx.geo = { country, blocked };

    if (blocked) {
      if (onBlocked) {
        return onBlocked(req, ctx, country ?? "");
      }
      return NextResponse.json(
        { error: "Access restricted", country },
        { status: 403 }
      );
    }

    const response = await next();

    if (addCountryHeader && country) {
      response.headers.set("x-edgepipe-country", country);
    }

    return response;
  };
}

import type { NextRequest } from "next/server";

export interface GeoAdapter {
  getCountry(req: NextRequest): Promise<string | null>;
}

export interface RateLimitAdapter {
  increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; reset: number }>;
  get(key: string): Promise<{ count: number; reset: number } | null>;
}

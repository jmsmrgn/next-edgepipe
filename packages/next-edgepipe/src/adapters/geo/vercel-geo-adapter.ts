import type { NextRequest } from "next/server";
import type { GeoAdapter } from "../types.js";

export class VercelGeoAdapter implements GeoAdapter {
  async getCountry(req: NextRequest): Promise<string | null> {
    const geo = (req as NextRequest & { geo?: { country?: string } }).geo;
    if (geo?.country) return geo.country;
    return req.headers.get("x-vercel-ip-country");
  }
}

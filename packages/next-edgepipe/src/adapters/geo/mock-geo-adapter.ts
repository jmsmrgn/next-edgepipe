import type { NextRequest } from "next/server";
import type { GeoAdapter } from "../types.js";

/**
 * For use in tests and local development only.
 * Do not use in production.
 */
export class MockGeoAdapter implements GeoAdapter {
  constructor(private readonly defaultCountry: string = "US") {}

  async getCountry(_req: NextRequest): Promise<string | null> {
    return this.defaultCountry;
  }
}

import type { RateLimitAdapter } from "../types.js";

const store = new Map<string, { count: number; reset: number }>();

/**
 * In-memory implementation suitable for local development and testing only.
 * State resets on cold starts and is not shared across Edge Runtime instances.
 * Use a Vercel KV or Redis-backed adapter in production for consistent rate
 * limiting across nodes.
 */
export class MemoryRateLimitAdapter implements RateLimitAdapter {
  constructor() {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[next-edgepipe] MemoryRateLimitAdapter is not suitable for production. " +
          "State resets on cold starts and is not shared across Edge Runtime instances. " +
          "Use a Vercel KV or Redis-backed adapter instead."
      );
    }
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; reset: number }> {
    const now = Date.now();
    const entry = store.get(key);

    if (entry && now < entry.reset) {
      entry.count += 1;
      return { count: entry.count, reset: entry.reset };
    }

    const next = { count: 1, reset: now + windowMs };
    store.set(key, next);
    return next;
  }

  async get(key: string): Promise<{ count: number; reset: number } | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.reset) {
      store.delete(key);
      return null;
    }
    return entry;
  }
}

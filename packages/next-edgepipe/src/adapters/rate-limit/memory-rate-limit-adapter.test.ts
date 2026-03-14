/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRateLimitAdapter } from "./memory-rate-limit-adapter.js";

describe("MemoryRateLimitAdapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("warns when instantiated in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      new MemoryRateLimitAdapter();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("[next-edgepipe]")
      );
    });

    it("does not warn outside production", () => {
      vi.stubEnv("NODE_ENV", "test");
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      new MemoryRateLimitAdapter();
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("increment", () => {
    it("starts count at 1 for a new key", async () => {
      const adapter = new MemoryRateLimitAdapter();
      const result = await adapter.increment("ip-1", 60_000);
      expect(result.count).toBe(1);
    });

    it("increments count within the same window", async () => {
      const adapter = new MemoryRateLimitAdapter();
      await adapter.increment("ip-2", 60_000);
      const result = await adapter.increment("ip-2", 60_000);
      expect(result.count).toBe(2);
    });

    it("resets count after window expires", async () => {
      const adapter = new MemoryRateLimitAdapter();
      await adapter.increment("ip-3", 1);
      await new Promise((r) => setTimeout(r, 5));
      const result = await adapter.increment("ip-3", 60_000);
      expect(result.count).toBe(1);
    });
  });

  describe("get", () => {
    it("returns null for unknown key", async () => {
      const adapter = new MemoryRateLimitAdapter();
      expect(await adapter.get("unknown-key")).toBeNull();
    });

    it("returns entry for a known key within window", async () => {
      const adapter = new MemoryRateLimitAdapter();
      await adapter.increment("ip-4", 60_000);
      const entry = await adapter.get("ip-4");
      expect(entry).not.toBeNull();
      expect(entry!.count).toBe(1);
    });

    it("returns null and cleans up after window expires", async () => {
      const adapter = new MemoryRateLimitAdapter();
      await adapter.increment("ip-5", 1);
      await new Promise((r) => setTimeout(r, 5));
      expect(await adapter.get("ip-5")).toBeNull();
    });
  });
});

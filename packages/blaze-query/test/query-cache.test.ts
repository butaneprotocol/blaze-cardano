import { describe, expect, test } from "vitest";
import { QueryCache, providerCacheKey } from "../src";

describe("QueryCache", () => {
  test("creates deterministic keys for structurally equal parameters", () => {
    expect(providerCacheKey("op", [{ b: 2n, a: "1" }])).toBe(
      providerCacheKey("op", [{ a: "1", b: 2n }]),
    );
  });

  test("returns cached values until their ttl expires", () => {
    let now = 1_000;
    const cache = new QueryCache<string, string>({
      ttlMs: 50,
      now: () => now,
    });

    cache.set("key", "value");
    expect(cache.read("key")).toEqual({ hit: true, value: "value" });
    now += 50;
    expect(cache.read("key")).toEqual({ hit: false });
  });

  test("evicts the least recently used entry when full", () => {
    const cache = new QueryCache<string, string>({ maxEntries: 2 });

    cache.set("a", "A");
    cache.set("b", "B");
    expect(cache.get("a")).toBe("A");
    cache.set("c", "C");

    expect(cache.get("a")).toBe("A");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe("C");
  });
});

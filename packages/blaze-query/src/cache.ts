/** @public */
export type QueryCacheEntry<V> = {
  value: V;
  expiresAt: number;
};

/** @public */
export type QueryCacheLookup<V> =
  | { hit: true; value: V }
  | { hit: false; value?: undefined };

/** @public */
export type QueryCacheOptions = {
  ttlMs?: number;
  maxEntries?: number;
  now?: () => number;
};

const DEFAULT_TTL_MS = 30_000;
const DEFAULT_MAX_ENTRIES = 500;

const hasMethod = <T extends string>(
  value: unknown,
  method: T,
): value is Record<T, () => unknown> =>
  typeof value === "object" &&
  value !== null &&
  method in value &&
  typeof (value as Record<T, unknown>)[method] === "function";

/** @public */
export const stableQueryValue = (value: unknown): unknown => {
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object" || value === null) return value;
  if (hasMethod(value, "toBech32")) return value.toBech32();
  if (hasMethod(value, "transactionId") && hasMethod(value, "index")) {
    return `${value.transactionId()}#${value.index()}`;
  }
  if (hasMethod(value, "hash")) return value.hash();
  if (Array.isArray(value)) return value.map(stableQueryValue);
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return String(value);
  }
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, inner]) => [key, stableQueryValue(inner)]),
  );
};

/** @public */
export const providerCacheKey = (
  operation: string,
  params: readonly unknown[],
): string => `${operation}:${JSON.stringify(stableQueryValue(params))}`;

/** @public */
export class QueryCache<K, V> {
  readonly #entries = new Map<K, QueryCacheEntry<V>>();
  readonly #ttlMs: number;
  readonly #maxEntries: number;
  readonly #now: () => number;

  constructor(options: QueryCacheOptions = {}) {
    this.#ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.#maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.#now = options.now ?? Date.now;
  }

  get size(): number {
    this.prune();
    return this.#entries.size;
  }

  read(key: K): QueryCacheLookup<V> {
    const entry = this.#entries.get(key);
    if (!entry) return { hit: false };
    if (entry.expiresAt <= this.#now()) {
      this.#entries.delete(key);
      return { hit: false };
    }
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return { hit: true, value: entry.value };
  }

  get(key: K): V | undefined {
    const lookup = this.read(key);
    return lookup.hit ? lookup.value : undefined;
  }

  set(key: K, value: V, ttlMs = this.#ttlMs): void {
    if (this.#entries.has(key)) this.#entries.delete(key);
    this.#entries.set(key, {
      value,
      expiresAt: this.#now() + ttlMs,
    });
    this.evict();
  }

  delete(key: K): boolean {
    return this.#entries.delete(key);
  }

  clear(): void {
    this.#entries.clear();
  }

  prune(): void {
    const now = this.#now();
    for (const [key, entry] of this.#entries) {
      if (entry.expiresAt <= now) this.#entries.delete(key);
    }
  }

  private evict(): void {
    this.prune();
    while (this.#entries.size > this.#maxEntries) {
      const oldest = this.#entries.keys().next();
      if (oldest.done) return;
      this.#entries.delete(oldest.value);
    }
  }
}

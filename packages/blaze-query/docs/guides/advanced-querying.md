---
title: Advanced querying
---

# Advanced querying

Use `CachedProvider` when an application needs repeated chain reads, shared caching, or a cleaner way to compose dependent provider calls while still passing a normal provider into Blaze.

```ts
import { CachedProvider } from "@blaze-cardano/query";

const query = new CachedProvider(provider);

const result = await query.chain(async (client) => {
  const scriptRef = await client.resolveScriptRef(validatorScript, scriptAddress);
  const userUtxos = await client.getUnspentOutputs(userAddress);
  return { scriptRef, userUtxos };
});
```

## Caching

`CachedProvider` caches deterministic read operations by operation name and argument values. Address-like values are keyed by Bech32, transaction inputs are keyed as `<tx-id>#<index>`, scripts are keyed by hash, object keys are sorted, and `bigint` values are encoded as strings.

```ts
import { CachedProvider, QueryCache } from "@blaze-cardano/query";

const cache = new QueryCache<string, unknown>({
  ttlMs: 15_000,
  maxEntries: 1_000,
});

const query = new CachedProvider(provider, { cache });

await query.getUnspentOutputs(address);
await query.getUnspentOutputs(address); // served from cache while the entry is fresh
```

Submission, confirmation, and transaction evaluation calls are delegated to the wrapped provider without caching. For reads that must reflect the next block immediately, prefer a short TTL or call the wrapped provider directly.

## Event streams

Kupmios exposes Ogmios chain-sync events through an async iterable.

```ts
const controller = new AbortController();

for await (const event of kupmios.events({ types: ["rollForward"] }, controller.signal)) {
  console.log(event.point);
}
```

Breaking out of the loop or aborting the signal closes the event queue.

Any provider can use the polling fallback for address-level UTxO changes.

```ts
import { pollAddressEvents } from "@blaze-cardano/query";

for await (const event of pollAddressEvents(provider, { address, intervalMs: 5_000 })) {
  if (event.type === "utxoProduced") {
    console.log("new output", event.input.toCore());
  }
}
```

## Benchmarks

Run the cache benchmark with:

```sh
bun --filter @blaze-cardano/query bench
```

The benchmark measures deterministic key generation, cache hits, and cache writes. Use it as a regression baseline when changing cache serialization or eviction behavior.

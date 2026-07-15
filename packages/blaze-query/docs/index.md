---
title: "@blaze-cardano/query"
---

`@blaze-cardano/query` contains the provider interfaces and chain-query implementations used by Blaze applications.

Use this package when an application needs to read chain data, evaluate transactions, submit transactions, or compose multiple provider backends behind one provider interface.

## Guides

- [Provider routing](./guides/provider-routing.md) explains how to route reads, evaluation, submission, and individual query operations to different providers.
- [Advanced querying](./guides/advanced-querying.md) covers cached reads, chained queries, chain events, Ogmios chain sync, and polling fallback.
- [Provider internals](./guides/provider-internals.md) documents provider implementation expectations, debug logging, error handling, and compatibility notes.

## Main API surface

- `Provider` defines the shared chain-query surface used across Blaze.
- `ProviderRouter` delegates provider methods to configured backends and supports per-method routing.
- `CachedProvider` wraps any provider with cache-aware read helpers while preserving the provider interface.
- `QueryCache` stores chain-query results with explicit invalidation.
- `OgmiosChainSync` and polling event helpers provide chain-event sources for applications that need to react to ledger changes.

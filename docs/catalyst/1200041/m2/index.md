# Catalyst 1200041 milestone 2 evidence

Proposal: [Blaze: Maintenance, Security Improvements, Testing & Assurances for the Blaze SDK](https://milestones.projectcatalyst.io/projects/1200041)

Current Statement of Milestones: `soms.id=10010`, Milestone 2, "Implement Comprehensive Chain Querying Capabilities".

## What M2 claims

The current SoM requires:

- Advanced chain querying functions, including websocket-based providers where on-chain events can be subscribed to and handled as they arrive.
- Ergonomic asynchronous setups where queries can be chained cleanly.
- Data caching and management systems.
- Performance optimizations for large-scale queries.
- Query performance that meets or exceeds predefined benchmarks.
- Documentation explaining querying capabilities and best practices.
- Example applications demonstrating advanced querying capabilities.

## Success criteria coverage

| Success criterion                                               | Evidence                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Chain querying functions are comprehensive and performant       | Query client, chain event sources, provider polling fallback, and provider docs              |
| Caching reduces repeated provider reads                         | `QueryCache`, `QueryClient.withCache`, cache tests, and benchmark output                     |
| Query performance meets or exceeds benchmark baseline           | `packages/blaze-query/benchmarks/query-cache.ts` enforces the minimum ops/sec baseline below |
| Documentation explains querying capabilities and best practices | Advanced querying and provider internals guides                                              |

## Implementation mapping

| Requirement                        | Evidence                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Advanced query API                 | `packages/blaze-query/src/query-client.ts`                                                                                    |
| Websocket-based subscriptions      | `packages/blaze-query/src/events.ts`, `packages/blaze-query/src/ogmios-chain-sync.ts`                                         |
| Provider-agnostic polling fallback | `packages/blaze-query/src/polling-events.ts`                                                                                  |
| Ergonomic chained queries          | `packages/blaze-query/src/query-client.ts`, `packages/blaze-query/test/query-client.test.ts`                                  |
| Data caching and management        | `packages/blaze-query/src/cache.ts`, `packages/blaze-query/test/query-cache.test.ts`                                          |
| Performance benchmarks             | `packages/blaze-query/benchmarks/query-cache.ts`                                                                              |
| Documentation                      | `packages/blaze-query/docs/guides/advanced-querying.md`, `packages/blaze-query/docs/guides/provider-internals.md`             |
| Examples                           | `examples/advanced-querying`, including `bun --filter advanced-querying typecheck` and `bun --filter advanced-querying start` |

## Verification

```sh
bun --filter @blaze-cardano/query test       # 8 files, 50 tests passing
bun --filter @blaze-cardano/query typecheck  # passing
bun --filter @blaze-cardano/query lint       # passing
bun --filter @blaze-cardano/query bench      # passing
bun --filter advanced-querying typecheck     # passing
bun --filter advanced-querying start         # passing
```

`bun --filter @blaze-cardano/query bench` fails if any operation falls below the predefined minimum. In GitHub Actions it also writes the benchmark table to the public run summary, so the PoA can link to the CI run as the benchmark result.

Current benchmark result:

| Operation | Iterations | Duration ms |  Ops/sec | Minimum ops/sec | Status |
| --------- | ---------: | ----------: | -------: | --------------: | ------ |
| cache-key |     100000 |       32.51 |  3075547 |         1000000 | pass   |
| cache-hit |     100000 |        5.68 | 17599437 |         5000000 | pass   |
| cache-set |       2000 |       23.65 |    84553 |           25000 | pass   |

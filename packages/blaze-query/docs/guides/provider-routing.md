---
title: Provider Routing
---

# Provider Routing

`RoutedProvider` lets an application use different providers for chain queries,
transaction evaluation, and transaction submission while still passing a single
provider into Blaze.

```ts
import { Blockfrost, Kupmios, Maestro, RoutedProvider } from "@blaze-cardano/query";

const provider = new RoutedProvider({
  defaultProvider: blockfrost,
  queryProvider: blockfrost,
  evaluationProvider: kupmios,
  submissionProvider: maestro,
});
```

Per-operation overrides are useful when a provider has a better implementation
for a specific query.

```ts
const provider = new RoutedProvider({
  defaultProvider: blockfrost,
  queryProvider: blockfrost,
  evaluationProvider: kupmios,
  submissionProvider: maestro,
  perOperation: {
    resolveScriptRef: blockfrost,
    getUnspentOutputsWithAsset: maestro,
  },
});
```

## Debug Logging

Pass `debugLogger` to observe provider calls. The logger receives the operation,
target provider, params, status, duration, and error when a provider throws.

```ts
const provider = new RoutedProvider({
  defaultProvider: blockfrost,
  evaluationProvider: kupmios,
  debugLogger(event) {
    console.debug(event.operation, event.status, event.durationMs);
  },
});
```

Applications should avoid logging secrets, API keys, signed transactions, or
personally identifying data. The debug event exposes the original method
parameters so callers can decide what to redact before writing logs.

---
title: "@blaze-cardano/vm"
---

`@blaze-cardano/vm` exposes a UPLC evaluator used by transaction building and emulator tests.

Most applications reach this through transaction evaluation on a provider. Use the package directly when a local test or tool needs to evaluate scripts without delegating to an external service.

## Main APIs

- `makeUplcEvaluator` creates an evaluator for local script execution.
- The evaluator integrates with `TxBuilder.useEvaluator` and emulator-backed tests.

Start with the [introduction](./guides/introduction.md) and the transaction [safety guide](/tx/guides/safety).

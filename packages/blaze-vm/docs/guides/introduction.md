# Introduction

`@blaze-cardano/vm` provides local UPLC evaluation helpers.

Most production applications evaluate transactions through a provider. The VM package is useful for tests, emulator flows, and developer tools that need local script evaluation without depending on an external evaluation service.

Typical usage:

1. Create an evaluator with `makeUplcEvaluator`.
2. Attach it to a transaction builder with `TxBuilder.useEvaluator`.
3. Run the transaction through the same completion path used by provider-backed flows.

For local ledger examples, see the emulator docs and the transaction [safety guide](/tx/guides/safety).

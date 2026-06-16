---
title: "@blaze-cardano/data"
---

`@blaze-cardano/data` provides helpers for defining and converting typed Plutus data.

Use it when contract-facing code needs a stable boundary between TypeScript values and the `PlutusData` values that validators receive on chain.

## Main APIs

- Data schemas for common Plutus data shapes.
- Conversion helpers for serializing application values into validator datums and redeemers.
- Type utilities used by higher-level transaction and blueprint flows.

Start with the [introduction](./guides/introduction.md) and the transaction [script guide](/tx/guides/script-transactions).

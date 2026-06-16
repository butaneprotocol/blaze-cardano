---
title: "@blaze-cardano/blueprint"
---

`@blaze-cardano/blueprint` reads Aiken blueprints and turns validator definitions into typed Blaze helpers.

Use it when an application wants to load validators from a `plutus.json` blueprint instead of hand-copying script CBOR, datum shapes, and redeemer shapes.

## Main APIs

- Blueprint parsing utilities load validator metadata from Aiken-generated files.
- Validator helpers expose compiled scripts and type information for transaction construction.
- The package works with `@blaze-cardano/tx` and `@blaze-cardano/sdk` for Aiken script transactions.

Start with the [introduction](./guides/introduction.md) and the SDK [Aiken transaction flow](/sdk/guides/aiken-transaction).

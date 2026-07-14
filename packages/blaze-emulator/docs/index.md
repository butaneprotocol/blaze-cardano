---
title: "@blaze-cardano/emulator"
---

# Emulator

`@blaze-cardano/emulator` provides an in-memory Cardano ledger for tests, demos, and local development. It can be used directly from TypeScript or driven over HTTP through the RPC server.

Start with these guides:

- [Governance testing](./guides/governance-testing.md) for DRep registration, votes, proposals, committee state, and parameter changes.
- [RPC server](./guides/rpc-server.md) for standalone emulator processes, network presets, clock control, raw CBOR transaction submission, OpenAPI docs, and cleanup.

The package also exposes a provider implementation so SDK code can run against the emulator through the same query, evaluation, and submission surface used by network providers.

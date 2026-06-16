---
title: "@blaze-cardano/emulator"
---

`@blaze-cardano/emulator` provides an in-process ledger for testing Blaze transactions without spending testnet funds.

Use it for unit and integration tests that need deterministic wallets, UTxOs, reference scripts, governance state, slot/epoch movement, and transaction validation.

## Guides

- [Testing a transaction](./guides/testing-a-transaction.md) covers the basic emulator workflow.
- [Governance testing](./guides/governance-testing.md) explains committee, DRep, proposal, vote, ratification, and enactment test flows.
- [RPC server](./guides/rpc-server.md) documents the HTTP interface for external test runners.

## Main APIs

- `Emulator` manages wallets, ledger state, blocks, epochs, governance state, and submitted transactions.
- `EmulatorProvider` implements the provider interface against emulator state.
- RPC helpers expose emulator actions over HTTP for non-TypeScript test clients.

---
title: "@blaze-cardano/sdk"
---

`@blaze-cardano/sdk` is the main application-facing entry point for Blaze.

It re-exports the core packages most applications need for transaction construction, chain queries, wallets, UPLC helpers, and script deployment. Applications can import from package-specific modules when they want a narrower dependency surface, or use the SDK package as the convenience layer.

## Guides

- [Getting started](./guides/getting-started.md) walks through provider, wallet, transaction, signing, and submission setup.
- [Aiken transaction flow](./guides/aiken-transaction.md) shows how to build and submit a script transaction from an Aiken blueprint.
- [Transaction building](/tx/guides/transaction-building) covers metadata, script locking, datum/redeemer handling, reference scripts, and transaction completion.
- [Script deployment](/deploy/guides/script-deployment) covers declarative reference-script deployment through `@blaze-cardano/deploy`, which is also exported from the SDK.

## Main APIs

- `Blaze.from(provider, wallet)` creates an application client with protocol parameters loaded from the provider.
- `newTransaction()` creates a `TxBuilder` wired to the wallet UTxOs, change address, network id, and provider evaluator.
- `signTransaction()` signs a transaction through the configured wallet and merges the returned witnesses.
- `submitTransaction()` submits through the wallet by default, or through the provider when requested.
- Deployment helpers from `@blaze-cardano/deploy` are available from the SDK for applications that want one import path.
